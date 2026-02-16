import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Popconfirm, message, Modal, Empty, Button, Checkbox, Upload, Switch, Slider, Row, Col } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  CloseOutlined,
  UploadOutlined,
  InboxOutlined,
  SwapOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { questionApi, ExportData, Question } from '../../api/question';
import { reviewApi, ReviewStatus, QuestionPracticeHistoryItem, QuestionPracticeStats } from '../../api/review';
import { tagApi, Tag } from '../../api/tag';
import { useUserStore } from '../../stores/userStore';
import { MarkdownPreview } from '../../components/MarkdownEditor';
import { ExportModal } from '../../components/PdfGenerator/ExportModal';
import styles from './Questions.module.css';
import ph from './PracticeHistory.module.css';

const PAGE_SIZE = 10;

const MASTERY_LABELS = ['未学', '初学', '熟悉', '掌握', '精通', '专家'];

const REVIEW_STATUS_OPTIONS: { label: string; value: ReviewStatus; color: string }[] = [
  { label: '没做对', value: 'FORGOTTEN', color: '#ef4444' },
  { label: '有点模糊', value: 'FUZZY', color: '#f59e0b' },
  { label: '完全掌握', value: 'MASTERED', color: '#10b981' },
];

function getMasteryClass(level: number): string {
  const classMap: Record<number, string> = {
    0: styles.masteryLevel0,
    1: styles.masteryLevel1,
    2: styles.masteryLevel2,
    3: styles.masteryLevel3,
    4: styles.masteryLevel4,
    5: styles.masteryLevel5,
  };
  return classMap[level] ?? styles.masteryLevel0;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  }
  if (diffDays === 1) {
    return '昨天';
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}周前`;
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 格式化为 YYYY-MM-DD HH:mm:ss 用于练习历史
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 横向拖拽组件 - 带惯性和自动加载
function HorizontalDrag({
  cards,
  onReachEnd,
}: {
  cards: React.ReactNode;
  onReachEnd?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const animationRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX;
    scrollLeft.current = containerRef.current.scrollLeft;
    lastX.current = e.pageX;
    lastTime.current = Date.now();
    velocity.current = 0;
    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.scrollBehavior = 'auto';
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const now = Date.now();
    const deltaX = e.pageX - lastX.current;
    const deltaTime = now - lastTime.current;

    // 计算速度
    if (deltaTime > 0) {
      velocity.current = deltaX / deltaTime;
    }

    lastX.current = e.pageX;
    lastTime.current = now;

    const walk = (e.pageX - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  // 惯性滚动
  const momentumScroll = useCallback(() => {
    if (!containerRef.current) return;

    const decay = 0.95;
    const minVelocity = 0.5;

    velocity.current *= decay;

    if (Math.abs(velocity.current) > minVelocity) {
      containerRef.current.scrollLeft -= velocity.current * 15;
      animationRef.current = requestAnimationFrame(momentumScroll);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!containerRef.current) return;
    isDragging.current = false;
    containerRef.current.style.cursor = 'grab';

    // 启动惯性滚动
    animationRef.current = requestAnimationFrame(momentumScroll);
  }, [momentumScroll]);

  const handleMouseLeave = useCallback(() => {
    if (!containerRef.current) return;
    isDragging.current = false;
    containerRef.current.style.cursor = 'grab';

    // 启动惯性滚动
    animationRef.current = requestAnimationFrame(momentumScroll);
  }, [momentumScroll]);

  // 自动加载更多
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onReachEnd) return;

    const el = containerRef.current;
    const { scrollWidth, clientWidth, scrollLeft } = el;

    // 当滚动到右边 50px 内时触发加载
    if (scrollWidth - scrollLeft - clientWidth < 50) {
      onReachEnd();
    }
  }, [onReachEnd]);

  return (
    <div
      ref={containerRef}
      className={ph.phCards}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onScroll={handleScroll}
    >
      {cards}
    </div>
  );
}

function generatePaginationRange(
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

interface SkeletonRowsProps {
  readonly count: number;
}

function SkeletonRows({ count }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={`skeleton-${i}`} className={styles.skeletonRow}>
          <div className={`${styles.skeletonCell} ${styles.skeletonSubject}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonContent}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonMastery}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonDate}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonActions}`} />
        </div>
      ))}
    </>
  );
}

export default function QuestionsPage() {
  const navigate = useNavigate();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState({
    subject: '',
    tag: '',
    search: '',
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // 刷题 Modal 状态
  const [practiceModalVisible, setPracticeModalVisible] = useState(false);
  const [practiceQuestion, setPracticeQuestion] = useState<Question | null>(null);
  const [practiceStatus, setPracticeStatus] = useState<ReviewStatus>('FUZZY');
  const [practiceSubmitting, setPracticeSubmitting] = useState(false);

  // 选择模式状态
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 导出弹窗状态
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // 导入弹窗状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importMeta, setImportMeta] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null);

  // 随机抽题弹窗状态
  const [randomPickModalVisible, setRandomPickModalVisible] = useState(false);
  const [randomPickLimit, setRandomPickLimit] = useState(20);
  const [randomPickFilters, setRandomPickFilters] = useState({
    subjects: [] as string[],
    tags: [] as string[],
    minMasteryLevel: undefined as number | undefined,
    maxMasteryLevel: undefined as number | undefined,
  });
  const [randomPickLoading, setRandomPickLoading] = useState(false);

  // 练习历史弹窗状态
  const [practiceHistoryModalVisible, setPracticeHistoryModalVisible] = useState(false);
  const [practiceHistoryQuestionId, setPracticeHistoryQuestionId] = useState<string | null>(null);
  const [practiceHistoryQuestionSubject, setPracticeHistoryQuestionSubject] = useState<string>('');
  const [practiceStats, setPracticeStats] = useState<QuestionPracticeStats | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<QuestionPracticeHistoryItem[]>([]);
  const [practiceHistoryLoading, setPracticeHistoryLoading] = useState(false);
  const [practiceHistoryPage, setPracticeHistoryPage] = useState(1);
  const [practiceHistoryTotal, setPracticeHistoryTotal] = useState(0);

  const totalPages = useMemo(() => Math.ceil(total / PAGE_SIZE), [total]);
  const paginationRange = useMemo(
    () => generatePaginationRange(page, totalPages),
    [page, totalPages],
  );

  const hasActiveFilters = filters.subject !== '' || filters.tag !== '' || filters.search !== '';

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await questionApi.getSubjects();
      setSubjects(res.data);
    } catch {
      // Silently fail for subjects fetch
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagApi.list();
      setTags(res.data);
    } catch {
      // Silently fail for tags fetch
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await questionApi.list({
        ...filters,
        page,
        pageSize: PAGE_SIZE,
      });
      setQuestions(res.data.data);
      setTotal(res.data.total);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '获取题目列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchSubjects();
    fetchTags();
  }, [isLoggedIn, navigate, fetchSubjects, fetchTags]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchQuestions();
  }, [isLoggedIn, fetchQuestions]);

  const handleDelete = async (id: string) => {
    try {
      await questionApi.delete(id);
      message.success('删除成功');
      fetchQuestions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  // 打开刷题 Modal
  const handleOpenPractice = (question: Question) => {
    setPracticeQuestion(question);
    setPracticeStatus('FUZZY');
    setPracticeModalVisible(true);
  };

  // 提交刷题结果
  const handlePracticeSubmit = async () => {
    if (!practiceQuestion) return;

    setPracticeSubmitting(true);
    try {
      await reviewApi.manualReview({
        questionId: practiceQuestion.id,
        status: practiceStatus,
      });

      message.success('已记录练习结果');
      setPracticeModalVisible(false);

      // 更新本地题目的掌握程度
      const newMastery =
        practiceStatus === 'FORGOTTEN' ? 0 : practiceStatus === 'FUZZY' ? 2 : 4;
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === practiceQuestion.id ? { ...q, masteryLevel: newMastery } : q,
        ),
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '提交失败，请重试');
    } finally {
      setPracticeSubmitting(false);
    }
  };

  // 打开练习历史
  const handleOpenPracticeHistory = useCallback(async (question: Question) => {
    setPracticeHistoryQuestionId(question.id);
    setPracticeHistoryQuestionSubject(question.subject);
    setPracticeHistoryModalVisible(true);
    setPracticeHistoryPage(1);
    setPracticeHistoryLoading(true);

    try {
      // 获取统计数据
      const statsRes = await reviewApi.getQuestionPracticeStats(question.id);
      setPracticeStats(statsRes.data);

      // 获取历史记录
      const historyRes = await reviewApi.getQuestionPracticeHistory(question.id, 1, 10);
      setPracticeHistory(historyRes.data.data);
      setPracticeHistoryTotal(historyRes.data.total);
    } catch (error) {
      message.error('获取练习历史失败');
    } finally {
      setPracticeHistoryLoading(false);
    }
  }, []);

  // 加载更多练习历史
  const handleLoadMorePracticeHistory = useCallback(async () => {
    if (!practiceHistoryQuestionId || practiceHistoryLoading) return;

    setPracticeHistoryLoading(true);
    const nextPage = practiceHistoryPage + 1;

    try {
      const res = await reviewApi.getQuestionPracticeHistory(practiceHistoryQuestionId, nextPage, 10);
      setPracticeHistory((prev) => [...prev, ...res.data.data]);
      setPracticeHistoryPage(nextPage);
      setPracticeHistoryTotal(res.data.total);
    } catch (error) {
      message.error('加载更多历史记录失败');
    } finally {
      setPracticeHistoryLoading(false);
    }
  }, [practiceHistoryQuestionId, practiceHistoryPage, practiceHistoryLoading]);

  const handleView = (question: Question) => {
    setCurrentQuestion(question);
    setViewModalVisible(true);
  };

  const handleCloseModal = () => {
    setViewModalVisible(false);
    setCurrentQuestion(null);
  };

  const handleSearchInput = (value: string) => {
    setSearchValue(value);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
      setPage(1);
    }, 400);
  };

  const handleSubjectFilter = (subject: string) => {
    const nextSubject = filters.subject === subject ? '' : subject;
    setFilters((prev) => ({ ...prev, subject: nextSubject }));
    setPage(1);
  };

  const handleTagFilter = (tagName: string) => {
    const nextTag = filters.tag === tagName ? '' : tagName;
    setFilters((prev) => ({ ...prev, tag: nextTag }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ subject: '', tag: '', search: '' });
    setSearchValue('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // ===== 选择模式处理函数 =====
  const handleToggleSelectMode = useCallback(() => {
    setSelectMode((prev) => !prev);
    if (selectMode) {
      // 退出选择模式时清空选择
      setSelectedIds(new Set());
    }
  }, [selectMode]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  }, [questions, selectedIds]);

  const handleOpenExport = useCallback(() => {
    if (selectedIds.size === 0) {
      message.warning('请先选择题目');
      return;
    }
    setExportModalVisible(true);
  }, [selectedIds]);

  // 导出全部题目
  const handleExportAll = useCallback(async (includeMeta: boolean) => {
    try {
      message.loading('正在导出题目...', 0);
      const res = await questionApi.export(includeMeta);
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fixit-questions-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.destroy();
      message.success(`已导出 ${total} 道题目`);
    } catch {
      message.destroy();
      message.error('导出失败，请重试');
    }
  }, [total]);

  // 打开导入弹窗
  const handleOpenImport = useCallback(() => {
    setImportResult(null);
    setImportModalVisible(true);
  }, []);

  // 处理文件上传导入
  const handleImport = useCallback(async (file: File) => {
    try {
      setImporting(true);
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      if (!data.questions || !Array.isArray(data.questions)) {
        message.error('文件格式不正确');
        return false;
      }

      const res = await questionApi.import(data, importMeta);
      setImportResult(res.data);

      if (res.data.success > 0) {
        message.success(`成功导入 ${res.data.success} 道题目`);
        // 刷新列表
        fetchQuestions();
      }

      if (res.data.skipped > 0) {
        message.info(`跳过 ${res.data.skipped} 道重复题目`);
      }

      if (res.data.errors.length > 0) {
        message.warning(`部分题目导入失败: ${res.data.errors[0]}`);
      }
    } catch (error) {
      message.error('导入失败，请检查文件格式');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }

    return false; // 阻止自动上传
  }, [importMeta, fetchQuestions]);

  // 打开随机抽题弹窗
  const handleOpenRandomPick = useCallback(() => {
    setRandomPickLimit(20);
    setRandomPickFilters({
      subjects: [],
      tags: [],
      minMasteryLevel: undefined,
      maxMasteryLevel: undefined,
    });
    setRandomPickModalVisible(true);
  }, []);

  // 执行随机抽题并跳转练习
  const handleRandomPick = useCallback(async () => {
    setRandomPickLoading(true);
    try {
      const res = await questionApi.randomPick({
        limit: randomPickLimit,
        subjects: randomPickFilters.subjects.length ? randomPickFilters.subjects : undefined,
        tags: randomPickFilters.tags.length ? randomPickFilters.tags : undefined,
        minMasteryLevel: randomPickFilters.minMasteryLevel,
        maxMasteryLevel: randomPickFilters.maxMasteryLevel,
      });

      if (res.data.questionIds && res.data.questionIds.length > 0) {
        // 调用练习 API 创建练习轮次
        await reviewApi.startPracticeSession({
          limit: randomPickLimit,
          subjects: randomPickFilters.subjects.length ? randomPickFilters.subjects : undefined,
          tags: randomPickFilters.tags.length ? randomPickFilters.tags : undefined,
          minMasteryLevel: randomPickFilters.minMasteryLevel,
          maxMasteryLevel: randomPickFilters.maxMasteryLevel,
        });

        message.success(`已随机抽取 ${res.data.questionIds.length} 道题目`);
        setRandomPickModalVisible(false);
        navigate('/practice');
      } else {
        message.warning('没有符合条件的题目');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '随机抽题失败');
    } finally {
      setRandomPickLoading(false);
    }
  }, [randomPickLimit, randomPickFilters, navigate]);

  // 获取选中的题目
  const selectedQuestions = useMemo(
    () => questions.filter((q) => selectedIds.has(q.id)),
    [questions, selectedIds],
  );

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>题库</h1>
          <p className={styles.pageSubtitle}>
            管理和浏览你的所有错题记录
          </p>
        </div>
        <div className={styles.headerActions}>
          {selectMode ? (
            <>
              <span className={styles.selectCount}>
                已选择 <strong>{selectedIds.size}</strong> 道题目
              </span>
              <button
                type="button"
                className={styles.exportButton}
                onClick={handleOpenExport}
                disabled={selectedIds.size === 0}
              >
                <DownloadOutlined />
                导出试卷
              </button>
              <button
                type="button"
                className={styles.cancelSelectButton}
                onClick={handleToggleSelectMode}
              >
                <CloseOutlined />
                取消
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.selectButton}
                onClick={handleOpenImport}
              >
                <UploadOutlined />
                导入
              </button>
              <button
                type="button"
                className={styles.randomPickButton}
                onClick={handleOpenRandomPick}
              >
                <SwapOutlined />
                随机抽题
              </button>
              <Link to="/import">
                <button type="button" className={styles.addButton}>
                  <PlusOutlined />
                  录入题目
                </button>
              </Link>
              <button
                type="button"
                className={styles.selectButton}
                onClick={() => handleExportAll(false)}
              >
                <DownloadOutlined />
                导出
              </button>
              <button
                type="button"
                className={styles.selectButton}
                onClick={handleToggleSelectMode}
              >
                <FileTextOutlined />
                选择
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className={styles.filterPanel}>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>学科</span>
          <div className={styles.subjectChips}>
            {subjects.map((subject) => (
              <button
                key={subject}
                type="button"
                className={`${styles.subjectChip} ${
                  filters.subject === subject ? styles.subjectChipActive : ''
                }`}
                onClick={() => handleSubjectFilter(subject)}
              >
                {subject}
              </button>
            ))}
            {subjects.length === 0 && (
              <span
                style={{ fontSize: 13, color: 'var(--color-text-placeholder)' }}
              >
                暂无学科
              </span>
            )}
          </div>

          <div className={styles.filterDivider} />

          <span className={styles.filterLabel}>标签</span>
          <div className={styles.subjectChips}>
            {tags.slice(0, 8).map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`${styles.subjectChip} ${
                  filters.tag === tag.name ? styles.subjectChipActive : ''
                }`}
                onClick={() => handleTagFilter(tag.name)}
              >
                {tag.name}
              </button>
            ))}
            {tags.length > 8 && (
              <span style={{ fontSize: 12, color: 'var(--color-text-placeholder)' }}>
                +{tags.length - 8}
              </span>
            )}
            {tags.length === 0 && (
              <span
                style={{ fontSize: 13, color: 'var(--color-text-placeholder)' }}
              >
                暂无标签
              </span>
            )}
          </div>
        </div>

        <div className={`${styles.filterRow} ${styles.filterRowSecond}`}>
          {/* 多字段搜索框 */}
          <div className={styles.searchWrapper}>
            <SearchOutlined className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="搜索：输入标签名 / 学科 / 题目内容..."
              value={searchValue}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
          </div>

          {/* 搜索类型提示 */}
          <div className={styles.searchTips}>
            <span className={styles.searchTipItem}>支持按标签名、学科、内容搜索</span>
          </div>

          {hasActiveFilters && (
            <div className={styles.filterActions}>
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearFilters}
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statsLeft}>
          <span className={styles.statsCount}>
            共 <strong>{total}</strong> 道题目
            {hasActiveFilters && ' (已筛选)'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {/* Table Header */}
        <div className={`${styles.tableHeader} ${selectMode ? styles.withSelect : ''}`}>
          {selectMode && (
            <div className={`${styles.tableHeaderCell} ${styles.selectCell}`}>
              <Checkbox
                checked={
                  questions.length > 0 && selectedIds.size === questions.length
                }
                indeterminate={
                  selectedIds.size > 0 && selectedIds.size < questions.length
                }
                onChange={handleSelectAll}
              />
            </div>
          )}
          <span className={styles.tableHeaderCell}>学科</span>
          <span className={styles.tableHeaderCell}>题目内容</span>
          <span className={styles.tableHeaderCell}>掌握程度</span>
          <span className={styles.tableHeaderCell}>创建时间</span>
          <span className={styles.tableHeaderCell}>操作</span>
        </div>

        {/* Table Body */}
        {loading ? (
          <SkeletonRows count={5} />
        ) : questions.length > 0 ? (
          questions.map((question, index) => (
            <div
              key={question.id}
              className={`${styles.tableRow} ${styles.fadeIn} ${
                selectedIds.has(question.id) ? styles.rowSelected : ''
              } ${selectMode ? styles.withSelect : ''}`}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              {/* Select */}
              {selectMode && (
                <div className={styles.cellSelect}>
                  <Checkbox
                    checked={selectedIds.has(question.id)}
                    onChange={() => handleToggleSelect(question.id)}
                  />
                </div>
              )}

              {/* Subject */}
              <div className={styles.cellSubject}>
                <span className={styles.subjectBadge}>{question.subject}</span>
              </div>

              {/* Content */}
              <div className={styles.cellContent}>
                <div className={styles.contentText}>
                  <MarkdownPreview content={question.content} />
                </div>
                {question.tags && question.tags.length > 0 && (
                  <div className={styles.contentTags}>
                    {question.tags.slice(0, 3).map((t) => (
                      <span key={t.tag.id} className={styles.tagPill}>
                        {t.tag.name}
                      </span>
                    ))}
                    {question.tags.length > 3 && (
                      <span className={styles.tagPill}>
                        +{question.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mastery */}
              <div className={styles.cellMastery}>
                <span
                  className={`${styles.masteryBadge} ${getMasteryClass(
                    question.masteryLevel,
                  )}`}
                >
                  <span className={styles.masteryDot} />
                  {MASTERY_LABELS[question.masteryLevel] || '未知'}
                </span>
              </div>

              {/* Date */}
              <div className={styles.cellDate}>
                {formatDate(question.createdAt)}
              </div>

              {/* Actions */}
              <div className={styles.cellActions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnPractice}`}
                  title="刷题"
                  onClick={() => handleOpenPractice(question)}
                >
                  <PlayCircleOutlined />
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnHistory}`}
                  title="练习历史"
                  onClick={() => handleOpenPracticeHistory(question)}
                >
                  <HistoryOutlined />
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnView}`}
                  title="查看"
                  onClick={() => handleView(question)}
                >
                  <EyeOutlined />
                </button>
                <Link to={`/questions/${question.id}`}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                    title="编辑"
                  >
                    <EditOutlined />
                  </button>
                </Link>
                <Popconfirm
                  title="删除题目"
                  description="确定删除这道题目吗？此操作不可撤销。"
                  onConfirm={() => handleDelete(question.id)}
                  okText="删除"
                  cancelText="取消"
                  overlayClassName={styles.popconfirmOverlay}
                >
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    title="删除"
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileTextOutlined />
            </div>
            <h3 className={styles.emptyTitle}>
              {hasActiveFilters ? '没有匹配的题目' : '还没有录入题目'}
            </h3>
            <p className={styles.emptyDesc}>
              {hasActiveFilters
                ? '尝试调整筛选条件或清除搜索关键词'
                : '点击右上角「录入题目」开始添加你的第一道错题'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearFilters}
              >
                清除筛选
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              第 {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条
            </span>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.paginationBtn}
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <LeftOutlined />
              </button>

              {paginationRange.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className={styles.paginationBtn}
                    style={{
                      border: 'none',
                      cursor: 'default',
                      color: 'var(--color-text-placeholder)',
                    }}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.paginationBtn} ${
                      page === item ? styles.paginationBtnActive : ''
                    }`}
                    onClick={() => handlePageChange(item)}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                className={styles.paginationBtn}
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                <RightOutlined />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Question Modal */}
      <Modal
        title="题目详情"
        open={viewModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={640}
        className={styles.viewModal}
      >
        {currentQuestion && (
          <div className={styles.modalContent}>
            {/* Subject */}
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>学科</span>
              <span className={styles.modalSubjectBadge}>
                {currentQuestion.subject}
              </span>
            </div>

            {/* Mastery Level */}
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>掌握程度</span>
              <span
                className={`${styles.masteryBadge} ${getMasteryClass(
                  currentQuestion.masteryLevel,
                )}`}
              >
                <span className={styles.masteryDot} />
                {MASTERY_LABELS[currentQuestion.masteryLevel] || '未知'}
              </span>
            </div>

            {/* Tags */}
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <div className={styles.modalField}>
                <span className={styles.modalLabel}>标签</span>
                <div className={styles.modalTags}>
                  {currentQuestion.tags.map((t) => (
                    <span key={t.tag.id} className={styles.modalTag}>
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>题目内容</span>
              <div className={styles.modalContentBox}>
                {currentQuestion.content ? (
                  <MarkdownPreview content={currentQuestion.content} />
                ) : (
                  <Empty description="暂无内容" />
                )}
              </div>
            </div>

            {/* Answer */}
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>答案</span>
              <div className={styles.modalAnswerBox}>
                {currentQuestion.answer ? (
                  <MarkdownPreview content={currentQuestion.answer} />
                ) : (
                  <Empty description="暂无答案" />
                )}
              </div>
            </div>

            {/* Analysis */}
            {currentQuestion.analysis && (
              <div className={styles.modalField}>
                <span className={styles.modalLabel}>解析</span>
                <div className={styles.modalAnalysisBox}>
                  <MarkdownPreview content={currentQuestion.analysis} />
                </div>
              </div>
            )}

            {/* Images */}
            {currentQuestion.images && currentQuestion.images.length > 0 && (
              <div className={styles.modalField}>
                <span className={styles.modalLabel}>图片</span>
                <div className={styles.modalImages}>
                  {currentQuestion.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`图片 ${idx + 1}`}
                      className={styles.modalImage}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className={styles.modalMeta}>
              <span>创建于 {formatDate(currentQuestion.createdAt)}</span>
              <span>最后更新 {formatDate(currentQuestion.updatedAt)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Practice Modal */}
      <Modal
        title="快速刷题"
        open={practiceModalVisible}
        onCancel={() => setPracticeModalVisible(false)}
        footer={null}
        width={560}
        className={styles.practiceModal}
      >
        {practiceQuestion && (
          <div className={styles.practiceContent}>
            {/* Header: Subject & Tags */}
            <div className={styles.practiceHeader}>
              <div className={styles.practiceMetaLeft}>
                <span className={styles.practiceSubjectBadge}>
                  {practiceQuestion.subject}
                </span>
                {practiceQuestion.tags && practiceQuestion.tags.length > 0 && (
                  <div className={styles.practiceTagsMini}>
                    {practiceQuestion.tags.slice(0, 3).map((t) => (
                      <span key={t.tag.id} className={styles.practiceTagMini}>
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.practiceMetaRight}>
                <span className={styles.practiceMasteryLabel}>
                  当前: {MASTERY_LABELS[practiceQuestion.masteryLevel] || '未知'}
                </span>
              </div>
            </div>

            {/* Question Content - Full Preview */}
            <div className={styles.practiceQuestionBox}>
              <MarkdownPreview content={practiceQuestion.content} />
            </div>

            {/* Answer Toggle */}
            <div className={styles.practiceAnswerSection}>
              <div className={styles.practiceAnswerLabel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>答案</span>
              </div>
              <div className={styles.practiceAnswerContent}>
                <MarkdownPreview content={practiceQuestion.answer} />
              </div>
            </div>

            {/* Status Selection */}
            <div className={styles.practiceStatusSection}>
              <div className={styles.practiceStatusHeader}>
                <span className={styles.practiceStatusLabel}>你的掌握程度</span>
                <span className={styles.practiceStatusHint}>选择后自动进入下一题</span>
              </div>
              <div className={styles.practiceStatusButtons}>
                {REVIEW_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.practiceStatusBtn} ${
                      practiceStatus === option.value ? styles.practiceStatusBtnActive : ''
                    }`}
                    style={{
                      '--status-color': option.color,
                    } as React.CSSProperties}
                    onClick={() => setPracticeStatus(option.value)}
                  >
                    <span
                      className={styles.practiceStatusDot}
                      style={{ background: option.color }}
                    />
                    <span className={styles.practiceStatusText}>{option.label}</span>
                    <span className={styles.practiceStatusKey}>
                      {option.value === 'FORGOTTEN' ? '1' : option.value === 'FUZZY' ? '2' : '3'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shortcut Hint */}
            <div className={styles.practiceShortcuts}>
              <span>快捷键:</span>
              <kbd>1</kbd> 没做对
              <kbd>2</kbd> 有点模糊
              <kbd>3</kbd> 完全掌握
            </div>

            {/* Actions */}
            <div className={styles.practiceActions}>
              <Button
                onClick={() => setPracticeModalVisible(false)}
                className={styles.practiceCancelBtn}
              >
                关闭
              </Button>
              <Button
                type="primary"
                onClick={handlePracticeSubmit}
                loading={practiceSubmitting}
                className={styles.practiceSubmitBtn}
              >
                确认并继续
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <ExportModal
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        questions={selectedQuestions}
      />

      {/* Import Modal */}
      <Modal
        title="导入题目"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={480}
        className={styles.importModal}
      >
        <div className={styles.importContent}>
          {/* 上传区域 */}
          <Upload.Dragger
            name="file"
            accept=".json"
            showUploadList={false}
            beforeUpload={handleImport}
            disabled={importing}
            className={styles.importUploader}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽 JSON 文件到此处</p>
            <p className="ant-upload-hint">
              支持导入 Fixit 导出的题目文件
            </p>
          </Upload.Dragger>

          {/* 选项 */}
          <div className={styles.importOptions}>
            <div className={styles.importOption}>
              <span>包含刷题元数据</span>
              <Switch
                checked={importMeta}
                onChange={setImportMeta}
                disabled={importing}
              />
            </div>
            <p className={styles.importHint}>
              开启后会导入掌握程度、复习时间等数据（如果有）
            </p>
          </div>

          {/* 导入结果 */}
          {importResult && (
            <div className={styles.importResult}>
              <div className={styles.importResultItem}>
                <span className={styles.importResultLabel}>成功导入</span>
                <span className={styles.importResultValue}>{importResult.success}</span>
              </div>
              <div className={styles.importResultItem}>
                <span className={styles.importResultLabel}>跳过重复</span>
                <span className={styles.importResultValue}>{importResult.skipped}</span>
              </div>
              {importResult.errors.length > 0 && (
                <div className={styles.importResultError}>
                  <span>失败: {importResult.errors[0]}</span>
                </div>
              )}
            </div>
          )}

          {/* 提示 */}
          <div className={styles.importTips}>
            <p>导入提示：</p>
            <ul>
              <li>只会导入不重复的题目</li>
              <li>元数据包括掌握程度、下次复习时间等</li>
              <li>标签会自动创建（如果不存在）</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Random Pick Modal */}
      <Modal
        title="随机抽题"
        open={randomPickModalVisible}
        onCancel={() => setRandomPickModalVisible(false)}
        footer={null}
        width={480}
        className={styles.randomPickModal}
      >
        <div className={styles.randomPickContent}>
          {/* 题目数量 */}
          <div className={styles.randomPickItem}>
            <label>题目数量</label>
            <Slider
              min={5}
              max={50}
              step={5}
              value={randomPickLimit}
              onChange={setRandomPickLimit}
              marks={{ 10: '10', 20: '20', 30: '30', 40: '40', 50: '50' }}
            />
            <span className={styles.randomPickValue}>{randomPickLimit} 题</span>
          </div>

          {/* 学科筛选 */}
          <div className={styles.randomPickItem}>
            <label>学科筛选</label>
            <div className={styles.randomPickChips}>
              <button
                className={`${styles.randomPickChip} ${randomPickFilters.subjects.length === 0 ? styles.randomPickChipActive : ''}`}
                onClick={() => setRandomPickFilters({ ...randomPickFilters, subjects: [] })}
              >
                全部
              </button>
              {subjects.map((s) => (
                <button
                  key={s}
                  className={`${styles.randomPickChip} ${randomPickFilters.subjects.includes(s) ? styles.randomPickChipActive : ''}`}
                  onClick={() => {
                    const newSubjects = randomPickFilters.subjects.includes(s)
                      ? randomPickFilters.subjects.filter((sub) => sub !== s)
                      : [...randomPickFilters.subjects, s];
                    setRandomPickFilters({ ...randomPickFilters, subjects: newSubjects });
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          <div className={styles.randomPickItem}>
            <label>标签筛选</label>
            <div className={styles.randomPickChips}>
              <button
                className={`${styles.randomPickChip} ${randomPickFilters.tags.length === 0 ? styles.randomPickChipActive : ''}`}
                onClick={() => setRandomPickFilters({ ...randomPickFilters, tags: [] })}
              >
                全部
              </button>
              {tags.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  className={`${styles.randomPickChip} ${randomPickFilters.tags.includes(t.name) ? styles.randomPickChipActive : ''}`}
                  onClick={() => {
                    const newTags = randomPickFilters.tags.includes(t.name)
                      ? randomPickFilters.tags.filter((tag) => tag !== t.name)
                      : [...randomPickFilters.tags, t.name];
                    setRandomPickFilters({ ...randomPickFilters, tags: newTags });
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* 掌握程度范围 */}
          <div className={styles.randomPickItem}>
            <label>掌握程度范围</label>
            <Row gutter={16}>
              <Col span={11}>
                <select
                  className={styles.randomPickSelect}
                  value={randomPickFilters.minMasteryLevel ?? ''}
                  onChange={(e) => setRandomPickFilters({
                    ...randomPickFilters,
                    minMasteryLevel: e.target.value ? Number(e.target.value) : undefined,
                  })}
                >
                  <option value="">不限最低</option>
                  {MASTERY_LABELS.map((label, index) => (
                    <option key={index} value={index}>{label}</option>
                  ))}
                </select>
              </Col>
              <Col span={2} className={styles.randomPickDivider}>--</Col>
              <Col span={11}>
                <select
                  className={styles.randomPickSelect}
                  value={randomPickFilters.maxMasteryLevel ?? ''}
                  onChange={(e) => setRandomPickFilters({
                    ...randomPickFilters,
                    maxMasteryLevel: e.target.value ? Number(e.target.value) : undefined,
                  })}
                >
                  <option value="">不限最高</option>
                  {MASTERY_LABELS.map((label, index) => (
                    <option key={index} value={index}>{label}</option>
                  ))}
                </select>
              </Col>
            </Row>
          </div>

          {/* 提示 */}
          <div className={styles.randomPickHint}>
            <p>随机抽取符合条件的题目，跳转到练习页面进行练习</p>
            <p>抽题不影响艾宾浩斯复习进度</p>
          </div>

          {/* 操作按钮 */}
          <div className={styles.randomPickActions}>
            <Button onClick={() => setRandomPickModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" onClick={handleRandomPick} loading={randomPickLoading}>
              开始抽题
            </Button>
          </div>
        </div>
      </Modal>

      {/* Practice History - Horizontal Flow */}
      <Modal
        title={
          <div className={ph.phHeader}>
            <div className={ph.phTitleRow}>
              <div className={ph.phIcon}>
                <HistoryOutlined style={{ color: '#9c9488', fontSize: 18 }} />
              </div>
              <span>练习历程</span>
            </div>
            <span className={ph.phSubject}>{practiceHistoryQuestionSubject}</span>
          </div>
        }
        open={practiceHistoryModalVisible}
        onCancel={() => setPracticeHistoryModalVisible(false)}
        footer={null}
        width={640}
        className={ph.phModal}
      >
        {/* Stats Bar */}
        {practiceStats && (
          <div className={ph.phStats}>
            <div className={ph.phStat}>
              <div className={ph.phStatNum}>{practiceStats.totalPracticeCount}</div>
              <div className={ph.phStatLabel}>Total</div>
            </div>
            <div className={ph.phStat}>
              <div className={ph.phStatNum}>{practiceStats.forgottenCount}</div>
              <div className={ph.phStatLabel}>Forgot</div>
            </div>
            <div className={ph.phStat}>
              <div className={ph.phStatNum}>{practiceStats.masteredCount}</div>
              <div className={ph.phStatLabel}>Mastered</div>
            </div>
          </div>
        )}

        {/* Horizontal Cards with Drag */}
        <div className={ph.phFlow}>
          <div className={ph.phFlowHeader}>
            <span className={ph.phFlowTitle}>Records</span>
            {practiceHistoryTotal > 0 && <span className={ph.phFlowCount}>{practiceHistoryTotal}</span>}
          </div>

          {practiceHistoryLoading && practiceHistory.length === 0 ? (
            <div className={ph.phLoading} />
          ) : practiceHistory.length === 0 ? (
            <div className={ph.phEmpty}>
              <div className={ph.phEmptyIcon}>
                <HistoryOutlined />
              </div>
              <div className={ph.phEmptyTitle}>暂无记录</div>
              <div className={ph.phEmptyDesc}>开始练习以记录学习轨迹</div>
            </div>
          ) : (
            <>
              <HorizontalDrag
                cards={practiceHistory.map((item) => (
                  <div key={item.id} className={ph.phCard}>
                    <div
                      className={`${ph.phCardStatus} ${
                        item.status === 'FORGOTTEN'
                          ? ph.phCardStatusForgot
                          : item.status === 'FUZZY'
                          ? ph.phCardStatusFuzzy
                          : ph.phCardStatusMastered
                      }`}
                    >
                      {item.status === 'FORGOTTEN' ? 'Forgot' : item.status === 'FUZZY' ? 'Fuzzy' : 'Mastered'}
                    </div>
                    <div className={ph.phCardTime}>{formatDateTime(item.createdAt)}</div>
                    {item.note && <div className={ph.phCardNote}>{item.note}</div>}
                  </div>
                ))}
                onReachEnd={practiceHistory.length < practiceHistoryTotal ? handleLoadMorePracticeHistory : undefined}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
