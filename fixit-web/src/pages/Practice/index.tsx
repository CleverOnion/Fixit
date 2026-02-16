// pages/Practice/index.tsx
// 练习页面 - 艾宾浩斯复习模式

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Modal, Row, Col, Button, Tooltip, Progress, Slider } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SettingOutlined,
  ReloadOutlined,
  BookOutlined,
  UnorderedListOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { MarkdownPreview } from '../../components/MarkdownEditor';
import { reviewApi, ReviewStatus, PracticeSession } from '../../api/review';
import { questionApi } from '../../api/question';
import { tagApi, Tag } from '../../api/tag';
import { useUserStore } from '../../stores/userStore';
import { useStatsStore } from '../../stores/statsStore';
import styles from './Practice.module.css';

const MASTERY_LABELS = ['未学', '初学', '熟悉', '掌握', '精通', '专家'];

const REVIEW_BUTTONS: {
  key: ReviewStatus;
  label: string;
  shortcut: string;
  styleClass: string;
}[] = [
  { key: 'FORGOTTEN', label: '没做对', shortcut: '1', styleClass: 'reviewBtnForgotten' },
  { key: 'FUZZY', label: '有点模糊', shortcut: '2', styleClass: 'reviewBtnFuzzy' },
  { key: 'MASTERED', label: '完全掌握', shortcut: '3', styleClass: 'reviewBtnMastered' },
];

const REVIEW_ICONS: Record<ReviewStatus, React.ReactNode> = {
  FORGOTTEN: <CloseCircleOutlined />,
  FUZZY: <QuestionCircleOutlined />,
  MASTERED: <CheckCircleOutlined />,
};

export default function PracticePage() {
  const navigate = useNavigate();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const { incrementCount, getStats } = useStatsStore();

  // 状态
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(20); // 每轮任务量

  // 练习轮次状态（从后端获取）
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [settings, setSettings] = useState({
    subjects: [] as string[],
    tags: [] as string[],
    minMasteryLevel: undefined as number | undefined,
    maxMasteryLevel: undefined as number | undefined,
  });

  const [questionPanelVisible, setQuestionPanelVisible] = useState(false);

  const handleReviewRef = useRef<((status: ReviewStatus) => void) | null>(null);

  // 计算当前状态
  const currentQuestion = session?.questions?.[session.currentIndex];
  const isCompleted = session?.status === 'COMPLETED';
  const isActive = session?.status === 'ACTIVE' && session.questions?.length > 0;
  const hasSession = session !== null && session.questions?.length > 0;

  // 今日统计
  const todayStats = getStats();

  // 获取学科列表
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await questionApi.getSubjects();
      if (Array.isArray(res.data)) {
        setSubjects(res.data);
      }
    } catch {}
  }, []);

  // 获取标签列表
  const fetchTags = useCallback(async () => {
    try {
      const res = await tagApi.list();
      if (Array.isArray(res.data)) {
        setTags(res.data);
      }
    } catch {}
  }, []);

  // 获取练习轮次状态
  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getPracticeSession();
      const data = res.data;

      // 确保数据完整才设置 session
      if (data && data.questions && data.questions.length > 0) {
        setSession(data);
      } else {
        setSession(null);
      }
    } catch {
      // 没有进行中的轮次
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchSubjects();
    fetchTags();
    fetchSession();
  }, [isLoggedIn, navigate, fetchSubjects, fetchTags, fetchSession]);

  // 开始练习轮次
  const handleStartPractice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.startPracticeSession({
        limit: dailyLimit,
        subjects: settings.subjects.length ? settings.subjects : undefined,
        tags: settings.tags.length ? settings.tags : undefined,
        minMasteryLevel: settings.minMasteryLevel,
        maxMasteryLevel: settings.maxMasteryLevel,
      });
      setSession(res.data);
      message.success('开始练习');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '开始练习失败');
    } finally {
      setLoading(false);
    }
  }, [dailyLimit, settings]);

  // 提交复习答案
  const handleReview = useCallback(
    async (status: ReviewStatus) => {
      if (!session || !currentQuestion || submitting) return;

      setSubmitting(true);
      try {
        const res = await reviewApi.submitPracticeAnswer(session.id, {
          questionId: currentQuestion.id,
          status,
        });

        // 增加今日统计
        incrementCount('ebbinghaus');

        if (res.data.isCompleted) {
          // 轮次完成
          setSession({ ...res.data.session, status: 'COMPLETED' });
        } else {
          // 进入下一题
          setSession(res.data.session);
          setShowAnswer(false);
          setCardKey((k) => k + 1);
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        message.error(err.response?.data?.message || '提交失败');
      } finally {
        setSubmitting(false);
      }
    },
    [session, currentQuestion, submitting, incrementCount]
  );

  handleReviewRef.current = handleReview;

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitting) return;
      const review = handleReviewRef.current;
      if (!review) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (!showAnswer) setShowAnswer(true);
          break;
        case '1':
          e.preventDefault();
          if (showAnswer && isActive) review('FORGOTTEN');
          break;
        case '2':
          e.preventDefault();
          if (showAnswer && isActive) review('FUZZY');
          break;
        case '3':
          e.preventDefault();
          if (showAnswer && isActive) review('MASTERED');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (showAnswer && isActive) review('MASTERED');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (showAnswer && isActive) review('FORGOTTEN');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, submitting, isActive]);

  // 切换题目
  const handleNavigate = useCallback(
    async (direction: 'prev' | 'next') => {
      if (!session || !isActive) return;

      try {
        const res = await reviewApi.navigateQuestion(session.id, direction);
        setSession(res.data);
        setShowAnswer(false);
      } catch (error) {
        message.error('切换失败');
      }
    },
    [session, isActive]
  );

  // 跳转到指定题目
  const handleJumpTo = useCallback(
    async (questionId: string) => {
      if (!session || !isActive) return;

      try {
        const res = await reviewApi.jumpToQuestion(session.id, questionId);
        setSession(res.data);
        setShowAnswer(false);
        setQuestionPanelVisible(false);
      } catch (error) {
        message.error('跳转失败');
      }
    },
    [session, isActive]
  );

  // 再开一轮
  const handleRestart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.resetDailyPractice(dailyLimit);
      setSession(res.data);
      message.success('开始新的一轮');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '开始新轮次失败');
    } finally {
      setLoading(false);
    }
  }, [dailyLimit]);

  // 渲染标签
  const renderTags = () => {
    if (!currentQuestion) return null;

    const result: React.ReactNode[] = [];

    result.push(
      <span key="mastery" className={`${styles.tagBadge} ${styles.tagMastery}`}>
        {MASTERY_LABELS[currentQuestion?.masteryLevel ?? 0]}
      </span>
    );

    result.push(
      <span key="subject" className={`${styles.tagBadge} ${styles.tagSubject}`}>
        {currentQuestion?.subject}
      </span>
    );

    if (currentQuestion?.tags?.length > 0) {
      currentQuestion.tags.forEach((t) => {
        result.push(
          <span key={t.tag.id} className={`${styles.tagBadge} ${styles.tagItem}`}>
            {t.tag.name}
          </span>
        );
      });
    }

    return result;
  };

  // 题目面板
  const questionPanelItems = useMemo(() => {
    if (!session) return [];
    return session.questions.map((q, index) => ({
      key: q.id,
      label: (
        <div
          className={`${styles.questionListItem} ${index === session.currentIndex ? styles.questionListItemActive : ''}`}
          onClick={() => handleJumpTo(q.id)}
        >
          <span className={styles.questionListIndex}>{index + 1}</span>
          <span className={styles.questionListSubject}>{q.subject}</span>
        </div>
      ),
    }));
  }, [session, handleJumpTo]);

  // 进度
  const progress = session && session.totalCount > 0 && session.currentIndex >= 0
    ? ((session.currentIndex + 1) / session.totalCount) * 100
    : 0;

  // 轮次完成页面
  if (!loading && isCompleted && session) {
    return (
      <div className={styles.container}>
        <div className={styles.completedContainer}>
          <div className={styles.completedCard}>
            <div className={styles.completedContent}>
              <CheckCircleOutlined className={styles.completedIcon} />
              <h1>艾宾浩斯复习完成</h1>
              <p>本轮完成 {session.finishedCount} 道题目</p>

              <div className={styles.completedStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{todayStats.totalCount}</span>
                  <span className={styles.statLabel}>今日累计</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{session.finishedCount}</span>
                  <span className={styles.statLabel}>本轮完成</span>
                </div>
              </div>

              <div className={styles.completedActions}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleRestart}
                >
                  再来一轮
                </Button>
                <Button size="large" onClick={() => navigate('/')}>
                  返回首页
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 没有进行中的轮次，显示开始练习页面
  if (!loading && !hasSession) {
    return (
      <div className={styles.container}>
        <div className={styles.modeSelection}>
          <div className={styles.modeHeader}>
            <BookOutlined className={styles.modeIcon} />
            <h2>艾宾浩斯复习</h2>
          </div>

          <div className={styles.startCard}>
            <p>按遗忘曲线复习需要巩固的题目</p>

            {/* 任务量设置 */}
            <div className={styles.limitSetting}>
              <label>每轮题目数量</label>
              <Slider
                min={5}
                max={50}
                step={5}
                value={dailyLimit}
                onChange={setDailyLimit}
                marks={{ 10: '10', 20: '20', 30: '30', 40: '40', 50: '50' }}
              />
              <span className={styles.limitValue}>{dailyLimit} 题</span>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<BookOutlined />}
              onClick={handleStartPractice}
              block
            >
              开始复习
            </Button>

            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => setSettingsModalVisible(true)}
              style={{ marginTop: 16 }}
            >
              筛选设置
            </Button>
          </div>
        </div>

        {/* 设置弹窗 */}
        <Modal
          title="筛选设置"
          open={settingsModalVisible}
          onCancel={() => setSettingsModalVisible(false)}
          onOk={() => setSettingsModalVisible(false)}
          okText="确定"
          width={480}
        >
          <div className={styles.filterForm}>
            {/* 学科多选 */}
            <div className={styles.filterItem}>
              <label>学科筛选</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <button
                  className={`${styles.filterChip} ${settings.subjects.length === 0 ? styles.filterChipActive : ''}`}
                  onClick={() => setSettings({ ...settings, subjects: [] })}
                >
                  全部
                </button>
                {subjects.map((s) => (
                  <button
                    key={s}
                    className={`${styles.filterChip} ${settings.subjects.includes(s) ? styles.filterChipActive : ''}`}
                    onClick={() => {
                      const newSubjects = settings.subjects.includes(s)
                        ? settings.subjects.filter((sub) => sub !== s)
                        : [...settings.subjects, s];
                      setSettings({ ...settings, subjects: newSubjects });
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签多选 */}
            <div className={styles.filterItem}>
              <label>标签筛选</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <button
                  className={`${styles.filterChip} ${settings.tags.length === 0 ? styles.filterChipActive : ''}`}
                  onClick={() => setSettings({ ...settings, tags: [] })}
                >
                  全部
                </button>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    className={`${styles.filterChip} ${settings.tags.includes(t.name) ? styles.filterChipActive : ''}`}
                    onClick={() => {
                      const newTags = settings.tags.includes(t.name)
                        ? settings.tags.filter((tag) => tag !== t.name)
                        : [...settings.tags, t.name];
                      setSettings({ ...settings, tags: newTags });
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 掌握程度范围 */}
            <div className={styles.filterItem}>
              <label>掌握程度范围</label>
              <Row gutter={16}>
                <Col span={11}>
                  <select
                    className={styles.filterSelect}
                    value={settings.minMasteryLevel ?? ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      minMasteryLevel: e.target.value ? Number(e.target.value) : undefined,
                    })}
                  >
                    <option value="">不限最低</option>
                    {MASTERY_LABELS.map((label, index) => (
                      <option key={index} value={index}>{label}</option>
                    ))}
                  </select>
                </Col>
                <Col span={2} className={styles.filterDivider}>--</Col>
                <Col span={11}>
                  <select
                    className={styles.filterSelect}
                    value={settings.maxMasteryLevel ?? ''}
                    onChange={(e) => setSettings({
                      ...settings,
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
          </div>
        </Modal>
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner} />
            <p>正在加载练习题目...</p>
          </div>
        </div>
      </div>
    );
  }

  // 练习进行中
  return (
    <div className={styles.container}>
      {/* Top Progress Bar */}
      <div className={styles.topProgressBar}>
        <Progress percent={Math.round(progress)} size="small" />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/">
            <button className={styles.backBtn} type="button">
              <ArrowLeftOutlined />
            </button>
          </Link>
          <div className={styles.progressIndicator}>
            <span className={styles.progressCurrent}>{(session?.currentIndex ?? 0) + 1}</span>
            <span className={styles.progressSlash}>/</span>
            <span className={styles.progressTotal}>{session?.totalCount}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.todayStats}>
            今日已刷: <strong>{todayStats.totalCount}</strong>题
          </span>

          {/* 题目列表下拉 */}
          <Tooltip title="题目列表">
            <Button
              icon={<UnorderedListOutlined />}
              onClick={() => setQuestionPanelVisible(!questionPanelVisible)}
            >
              {(session?.currentIndex ?? 0) + 1}/{session?.totalCount}
            </Button>
          </Tooltip>

          {/* 导航按钮 */}
          <div className={styles.navButtons}>
            <Tooltip title="上一题 (←)">
              <Button
                icon={<LeftOutlined />}
                onClick={() => handleNavigate('prev')}
                disabled={(session?.currentIndex ?? 0) === 0}
              />
            </Tooltip>
            <Tooltip title="下一题 (→)">
              <Button
                icon={<RightOutlined />}
                onClick={() => handleNavigate('next')}
                disabled={(session?.currentIndex ?? 0) >= (session?.totalCount || 0) - 1}
              />
            </Tooltip>
          </div>
        </div>
      </header>

      {/* 题目列表下拉面板 */}
      {questionPanelVisible && (
        <div className={styles.questionPanel}>
          <div className={styles.questionPanelHeader}>
            <span>题目列表</span>
            <button className={styles.closePanel} onClick={() => setQuestionPanelVisible(false)}>×</button>
          </div>
          <div className={styles.questionPanelContent}>
            {questionPanelItems.map((item) => (
              <div key={item.key}>{item.label}</div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={styles.main}>
        <div key={cardKey} className={`${styles.questionCard} ${styles.cardEnter}`}>
          <div style={{ padding: '24px' }}>
            {/* Tags */}
            <div className={styles.questionTags}>{renderTags()}</div>

            {/* Question */}
            <div className={styles.questionSection}>
              <h3 className={styles.sectionTitle}>题目</h3>
              <div className={styles.questionContent}>
                <MarkdownPreview content={currentQuestion?.content || ''} />
              </div>
            </div>

            {/* Answer */}
            <div className={styles.answerSection}>
              <div className={styles.answerHeader}>
                <h3 className={styles.sectionTitle}>答案</h3>
                <button type="button" className={styles.showAnswerBtn} onClick={() => setShowAnswer(!showAnswer)}>
                  {showAnswer ? <><EyeInvisibleOutlined /> 隐藏</> : <><EyeOutlined /> 显示</>}
                </button>
              </div>

              <div className={`${styles.answerContent} ${showAnswer ? styles.answerVisible : ''}`}>
                {showAnswer ? (
                  <div style={{ width: '100%' }}>
                    <MarkdownPreview content={currentQuestion?.answer || ''} />
                  </div>
                ) : (
                  <div className={styles.answerHidden} onClick={() => setShowAnswer(true)}>
                    <EyeOutlined className={styles.answerMaskIcon} />
                    <p>按空格键或点击查看答案</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis */}
            {showAnswer && currentQuestion?.analysis && (
              <div className={styles.analysisSection}>
                <h3 className={styles.sectionTitle}>解析</h3>
                <div className={styles.analysisContent}>
                  <MarkdownPreview content={currentQuestion.analysis} />
                </div>
              </div>
            )}

            {/* Review Buttons */}
            {showAnswer && (
              <div className={styles.reviewSection}>
                <p className={styles.reviewPrompt}>这道题掌握程度如何?</p>
                <div className={styles.reviewButtons}>
                  {REVIEW_BUTTONS.map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      className={`${styles.reviewBtn} ${styles[btn.styleClass as keyof typeof styles]} ${submitting ? styles.reviewBtnDisabled : ''}`}
                      onClick={() => handleReview(btn.key as ReviewStatus)}
                      disabled={submitting}
                    >
                      <span className={styles.reviewBtnIcon}>{REVIEW_ICONS[btn.key]}</span>
                      <span className={styles.reviewBtnLabel}>{btn.label}</span>
                      <span className={styles.reviewBtnShortcut}>{btn.shortcut}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.shortcutBarInCard}>
                  <kbd className={styles.kbd}>←</kbd> 没做对 / 有点模糊 / 完全掌握 <kbd className={styles.kbd}>→</kbd>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Space Prompt */}
        {!showAnswer && (
          <div className={styles.spacePrompt} onClick={() => setShowAnswer(true)}>
            <EyeOutlined className={styles.spacePromptIcon} />
            <span className={styles.spacePromptText}>
              按 <kbd className={styles.kbd}>Space</kbd> 显示答案
            </span>
          </div>
        )}
      </main>

      {/* Bottom Hint Bar */}
      <div className={styles.hintBar}>
        <span className={styles.hintItem}>
          <kbd className={styles.kbd}>Space</kbd>
          <span className={styles.hintLabel}>显示答案</span>
        </span>
        <span className={styles.hintItem}>
          <kbd className={styles.kbd}>1</kbd>
          <kbd className={styles.kbd}>2</kbd>
          <kbd className={styles.kbd}>3</kbd>
          <span className={styles.hintLabel}>评级</span>
        </span>
        <span className={styles.hintItem}>
          <kbd className={styles.kbd}>←</kbd>
          <kbd className={styles.kbd}>→</kbd>
          <span className={styles.hintLabel}>快速评级</span>
        </span>
      </div>
    </div>
  );
}
