import { useEffect, useState, useRef, useCallback, useMemo, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Popconfirm, message, Modal, Empty, Button, Checkbox, Upload, Switch, Slider, Row, Col, Input } from 'antd';
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
import { reviewApi, ReviewStatus } from '../../api/review';
import { tagApi, Tag } from '../../api/tag';
import { useUserStore } from '../../stores/userStore';
import { MarkdownPreview } from '../../components/MarkdownEditor';
import { ExportModal } from '../../components/PdfGenerator/ExportModal';
import { useIsMobile } from '../../hooks/useMediaQuery';
import styles from './Questions.module.css';

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
  const isMobile = useIsMobile();
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
  const [practiceNote, setPracticeNote] = useState('');
  const [practiceAnswerVisible, setPracticeAnswerVisible] = useState(false);
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
    setPracticeNote('');
    setPracticeAnswerVisible(false); // 重置答案隐藏状态
    setPracticeModalVisible(true);
  };

  // 提交刷题结果
  const handlePracticeSubmit = useCallback(async () => {
    if (!practiceQuestion) return;

    setPracticeSubmitting(true);
    try {
      await reviewApi.manualReview({
        questionId: practiceQuestion.id,
        status: practiceStatus,
        note: practiceNote || undefined,
      });

      message.success('已记录练习结果');
      setPracticeModalVisible(false);
      setPracticeNote('');

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
  }, [practiceQuestion, practiceStatus, practiceNote]);

  // 快速刷题 - 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!practiceModalVisible) return;

      // 空格键切换答案显示
      if (e.code === 'Space') {
        e.preventDefault();
        setPracticeAnswerVisible((prev) => !prev);
      }

      // 数字键选择状态
      if (e.key === '1') {
        e.preventDefault();
        setPracticeStatus('FORGOTTEN');
      } else if (e.key === '2') {
        e.preventDefault();
        setPracticeStatus('FUZZY');
      } else if (e.key === '3') {
        e.preventDefault();
        setPracticeStatus('MASTERED');
      }

      // Enter 键提交
      if (e.key === 'Enter' && !practiceSubmitting) {
        e.preventDefault();
        handlePracticeSubmit();
      }

      // Escape 键关闭
      if (e.key === 'Escape') {
        e.preventDefault();
        setPracticeModalVisible(false);
        setPracticeNote('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [practiceModalVisible, practiceSubmitting, handlePracticeSubmit, practiceStatus]);

  // 打开练习历史 - 跳转到练习历史页面
  const handleOpenPracticeHistory = useCallback((question: Question) => {
    navigate(`/questions/${question.id}/history`);
  }, [navigate]);

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
    <div className={styles.container} style={isMobile ? { maxWidth: '100vw', width: '100vw', margin: 0, padding: 0 } : {}}>
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
      <div className={styles.filterPanel} style={isMobile ? { width: '100%', maxWidth: '100vw', margin: 0, borderRadius: 0, borderLeft: 'none', borderRight: 'none', padding: '16px' } : {}}>
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
      <div className={styles.statsBar} style={isMobile ? { width: '100%', maxWidth: '100vw', padding: '12px 16px' } : {}}>
        <div className={styles.statsLeft}>
          <span className={styles.statsCount}>
            共 <strong>{total}</strong> 道题目
            {hasActiveFilters && ' (已筛选)'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper} style={isMobile ? { width: '100%', maxWidth: '100vw', padding: 0, margin: 0, background: 'transparent', border: 'none', borderRadius: 0 } : {}}>
        {/* Table Header */}
        <div
          className={`${styles.tableHeader} ${selectMode ? styles.withSelect : ''}`}
          style={isMobile ? { display: 'none' } : {}}
        >
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
          <div style={isMobile ? { display: 'none' } : {}}>
            <SkeletonRows count={5} />
          </div>
        ) : questions.length > 0 ? (
          questions.map((question, index) => (
            <Fragment key={question.id}>
              {/* Desktop table row - hidden on mobile */}
              <div
                key={`desktop-${question.id}`}
                className={`${styles.tableRow} ${styles.fadeIn} ${
                  selectedIds.has(question.id) ? styles.rowSelected : ''
                } ${selectMode ? styles.withSelect : ''}`}
                style={{
                  animationDelay: `${index * 0.04}s`,
                  display: isMobile ? 'none' : undefined
                }}
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

                {/* Desktop layout - hidden on mobile */}
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
                  {/* Remark - 简洁显示 */}
                  {question.remark && (
                    <div className={styles.contentRemark}>
                      <span className={styles.remarkLabel}>备注:</span>
                      <MarkdownPreview content={question.remark} />
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

              {/* Mobile card layout - visible only on mobile */}
              <div
                key={`mobile-${question.id}`}
                className={styles.mobileCard}
                style={isMobile ? { display: 'flex' } : { display: 'none' }}
              >
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileSubject}>{question.subject}</span>
                  <span className={styles.mobileMastery}>
                    {MASTERY_LABELS[question.masteryLevel] || '未知'}
                  </span>
                </div>
                <div className={styles.mobileCardContent}>
                  <MarkdownPreview content={question.content} />
                </div>
                {question.tags && question.tags.length > 0 && (
                  <div className={styles.mobileCardTags}>
                    {question.tags.slice(0, 4).map((t) => (
                      <span key={t.tag.id} className={styles.mobileTag}>
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.mobileCardFooter}>
                  <span className={styles.mobileDate}>{formatDate(question.createdAt)}</span>
                  <div className={styles.mobileActions}>
                    <button
                      type="button"
                      className={styles.mobileActionBtn}
                      onClick={() => handleOpenPractice(question)}
                    >
                      <PlayCircleOutlined />
                      <span>练习</span>
                    </button>
                    <button
                      type="button"
                      className={styles.mobileActionBtn}
                      onClick={() => handleOpenPracticeHistory(question)}
                    >
                      <HistoryOutlined />
                      <span>历史</span>
                    </button>
                    <Link
                      to={`/questions/${question.id}`}
                      className={styles.mobileActionBtn}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <EditOutlined />
                      <span>编辑</span>
                    </Link>
                  </div>
                </div>
              </div>
            </Fragment>
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

            {/* Remark */}
            {currentQuestion.remark && (
              <div className={styles.modalField}>
                <span className={styles.modalLabel}>备注</span>
                <div className={styles.modalRemarkBox}>
                  <MarkdownPreview content={currentQuestion.remark} />
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
        onCancel={() => {
          setPracticeModalVisible(false);
          setPracticeNote('');
        }}
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
            <div
              className={styles.practiceAnswerSection}
              onClick={() => setPracticeAnswerVisible(!practiceAnswerVisible)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.practiceAnswerLabel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>答案</span>
                <span className={styles.practiceAnswerHint}>
                  {practiceAnswerVisible ? '（点击隐藏）' : '（按空格或点击显示）'}
                </span>
              </div>
              {practiceAnswerVisible && (
                <div className={styles.practiceAnswerContent}>
                  <MarkdownPreview content={practiceQuestion.answer} />
                </div>
              )}
            </div>

            {/* Question Remark */}
            {practiceQuestion.remark && (
              <div className={styles.practiceRemarkSection}>
                <div className={styles.practiceRemarkLabel}>
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  <span>备注</span>
                </div>
                <div className={styles.practiceRemarkContent}>
                  <MarkdownPreview content={practiceQuestion.remark} />
                </div>
              </div>
            )}

            {/* Practice Note Input */}
            <div className={styles.practiceNoteSection}>
              <div className={styles.practiceNoteLabel}>
                <EditOutlined style={{ marginRight: 6 }} />
                <span>心得笔记（可选）</span>
              </div>
              <Input.TextArea
                className={styles.practiceNoteInput}
                placeholder="记录这道题的心得、思考、技巧..."
                value={practiceNote}
                onChange={(e) => setPracticeNote(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 5 }}
              />
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
              <kbd>空格</kbd> 显示/隐藏答案
              <kbd>1</kbd> 没做对
              <kbd>2</kbd> 有点模糊
              <kbd>3</kbd> 完全掌握
              <kbd>Enter</kbd> 确认
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
    </div>
  );
}
