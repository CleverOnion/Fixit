// pages/Home.tsx
// Homepage - Raycast/Linear inspired premium design

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  EditOutlined,
  ClockCircleOutlined,
  FireOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useUserStore, useQuestionStore } from '../stores';
import { reviewApi, Question, StreakData } from '../api/review';
import { questionApi } from '../api/question';
import { MarkdownInline } from '../components/MarkdownEditor';
import { useStatsStore } from '../stores/statsStore';
import { CollapseCard } from '../components/CollapseCard';
import styles from './Home.module.css';

const MASTERY_LABELS = ['未学', '初学', '熟悉', '掌握', '精通', '专家'];
const MASTERY_COLORS = ['#94A3B8', '#64748B', '#10B981', '#6366F1', '#8B5CF6', '#D97706'];

// Inline SVG icons for clean rendering without emoji
function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Animated number display
function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayed(0);
      return;
    }
    const duration = 600;
    const steps = 30;
    const stepDuration = duration / steps;
    let current = 0;
    const increment = value / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(Math.round(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <p className={styles.statValue}>
      {displayed}
      {suffix && <span className={styles.statSuffix}>{suffix}</span>}
    </p>
  );
}

// SVG Mastery Ring component
function MasteryRing({ percent, masteredCount, totalCount }: {
  percent: number;
  masteredCount: number;
  totalCount: number;
}) {
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={styles.ringWrapper}>
      <svg className={styles.ringSvg} viewBox="0 0 160 160">
        <defs>
          <linearGradient id="masteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          className={styles.ringBgCircle}
          cx="80"
          cy="80"
          r={radius}
        />
        <circle
          className={styles.ringProgressCircle}
          cx="80"
          cy="80"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringPercent}>
          {percent}
          <span className={styles.ringPercentSign}>%</span>
        </span>
        <span className={styles.ringLabel}>
          {masteredCount}/{totalCount}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserStore();
  const { questions, setQuestions } = useQuestionStore();
  const { getStats } = useStatsStore();

  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  // 获取今日统计（本地存储）
  const todayStats = getStats();
  const todayReviewed = todayStats.totalCount;

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [countRes, questionsRes, streakRes] = await Promise.all([
        reviewApi.getTodayCount().catch(() => ({ data: { count: 0 } })),
        questionApi.list({ page: 1, pageSize: 100 }).catch(() => ({ data: { data: [] } })),
        reviewApi.getStreak().catch(() => ({ data: null })),
      ]);

      setTodayCount(countRes.data.count);
      const fetchedQuestions = questionsRes.data.data || [];
      setRecentQuestions(fetchedQuestions.slice(0, 5)); // 只取前5条
      setStreakData(streakRes.data);
      // 更新 store 中的 questions
      setQuestions(fetchedQuestions);
    } catch (error) {
      // Dashboard load failed silently - data will show defaults
    } finally {
      setLoading(false);
    }
  }, [setQuestions]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [loadDashboardData, isLoggedIn, navigate]);

  // Computed values
  const masteredCount = useMemo(
    () => questions.filter(q => q.masteryLevel >= 3).length,
    [questions]
  );

  const masteryRate = useMemo(
    () => questions.length > 0 ? Math.round((masteredCount / questions.length) * 100) : 0,
    [masteredCount, questions.length]
  );

  const masteryDistribution = useMemo(() =>
    MASTERY_LABELS.map((label, index) => ({
      label,
      count: questions.filter(q => q.masteryLevel === index).length,
      color: MASTERY_COLORS[index],
    })),
    [questions]
  );

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  // Quick actions config
  const quickActions = useMemo(() => [
    {
      key: 'import',
      to: '/import',
      icon: <PlusOutlined />,
      title: '录入题目',
      subtitle: '添加新的错题',
      variant: styles.actionCardImport,
    },
    {
      key: 'practice',
      to: '/practice',
      icon: <CheckCircleOutlined />,
      title: todayCount > 0 ? `开始复习 (${todayCount})` : '开始复习',
      subtitle: todayCount > 0 ? '今日待复习' : '暂无任务',
      variant: todayCount > 0 ? styles.actionCardPractice : styles.actionCardInactive,
    },
    {
      key: 'stats',
      to: '/stats',
      icon: <BarChartOutlined />,
      title: '数据统计',
      subtitle: '查看学习报告',
      variant: styles.actionCardStats,
    },
    {
      key: 'questions',
      to: '/questions',
      icon: <EditOutlined />,
      title: '我的题目',
      subtitle: `${questions.length} 道题目`,
      variant: styles.actionCardQuestions,
    },
  ], [todayCount, questions.length]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  const getMasteryBadgeClass = (level: number): string => {
    const classMap: Record<number, string> = {
      0: styles.masteryBadge0,
      1: styles.masteryBadge1,
      2: styles.masteryBadge2,
      3: styles.masteryBadge3,
      4: styles.masteryBadge4,
      5: styles.masteryBadge5,
    };
    return classMap[level] ?? styles.masteryBadge0;
  };

  return (
    <div className={styles.container}>
      {/* ====== Hero Section ====== */}
      <section className={styles.heroSection}>
        <div className={styles.heroDecoration}>
          <div className={styles.heroCircle1} />
          <div className={styles.heroCircle2} />
          <div className={styles.heroCircle3} />
        </div>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.heroGreeting}>{greeting}</p>
            <h1 className={styles.heroTitle}>
              {user?.nickname || '用户'}，准备好学习了吗
            </h1>
            <p className={styles.heroSubtitle}>
              {todayCount > 0
                ? `今天有 ${todayCount} 道题目等待你复习，坚持就是胜利`
                : '今日复习任务已完成，继续保持这个节奏'}
            </p>
          </div>
          <div className={styles.heroRight}>
            {streakData?.currentStreak != null && streakData.currentStreak > 0 && (
              <div className={styles.streakBadge}>
                <FireOutlined className={styles.streakIcon} />
                <span className={styles.streakText}>
                  {streakData.currentStreak} 天连续
                </span>
              </div>
            )}
            {todayCount > 0 && (
              <button
                className={styles.heroActionBtn}
                onClick={() => navigate('/practice')}
              >
                <span>立即复习</span>
                <ArrowRightSmallIcon />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ====== Today Highlight Banner ====== */}
      {todayCount > 0 && (
        <div className={styles.todayBanner}>
          <div className={styles.todayIconWrapper}>
            <ClockCircleOutlined />
          </div>
          <div className={styles.todayInfo}>
            <h3 className={styles.todayTitle}>
              {todayCount} 道题目待复习
            </h3>
            <p className={styles.todayDesc}>
              根据记忆曲线，现在是最佳复习时间
            </p>
          </div>
          <button
            className={styles.todayAction}
            onClick={() => navigate('/practice')}
          >
            <span>开始</span>
            <ArrowRightSmallIcon />
          </button>
        </div>
      )}

      {/* ====== Quick Actions - Mobile Collapsed ====== */}
      <section className={styles.quickActionsSection}>
        <CollapseCard
          title="快捷入口"
          icon={<PlusOutlined />}
          defaultExpanded={true}
          showExpander={true}
        >
          <div className={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Link
                key={action.key}
                to={action.to}
                className={`${styles.actionCard} ${action.variant}`}
              >
                <div className={styles.actionIconWrapper}>
                  {action.icon}
                </div>
                <div className={styles.actionInfo}>
                  <h4>{action.title}</h4>
                  <p>{action.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </CollapseCard>
      </section>

      {/* ====== Stats Grid - Mobile Collapsed ====== */}
      <section className={styles.statsSection}>
        <CollapseCard
          title="学习概览"
          icon={<BarChartOutlined />}
          defaultExpanded={true}
          showExpander={true}
        >
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCardTotal}`}>
              <div className={styles.statHeader}>
                <p className={styles.statLabel}>总题目数</p>
                <div className={styles.statIconBadge}>
                  <EditOutlined />
                </div>
              </div>
              <AnimatedNumber value={questions.length} />
              <div className={styles.statFooter}>
                <span>全部错题</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCardReview}`}>
              <div className={styles.statHeader}>
                <p className={styles.statLabel}>今日待复习</p>
                <div className={styles.statIconBadge}>
                  <ClockCircleOutlined />
                </div>
              </div>
              <AnimatedNumber value={todayCount} />
              <div className={styles.statFooter}>
                <span>{todayCount > 0 ? '需要复习' : '已完成'}</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCardTodayReviewed}`}>
              <div className={styles.statHeader}>
                <p className={styles.statLabel}>今日已刷</p>
                <div className={styles.statIconBadge}>
                  <CheckCircleOutlined />
                </div>
              </div>
              <AnimatedNumber value={todayReviewed} />
              <div className={styles.statFooter}>
                <span>累计刷题</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCardMastery}`}>
              <div className={styles.statHeader}>
                <p className={styles.statLabel}>掌握率</p>
                <div className={styles.statIconBadge}>
                  <CheckCircleOutlined />
                </div>
              </div>
              <AnimatedNumber value={masteryRate} suffix="%" />
              <div className={styles.statFooter}>
                <span>{masteredCount} 题已掌握</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCardStreak}`}>
              <div className={styles.statHeader}>
                <p className={styles.statLabel}>连续学习</p>
                <div className={styles.statIconBadge}>
                  <FireOutlined />
                </div>
              </div>
              <AnimatedNumber
                value={streakData?.currentStreak ?? 0}
                suffix="天"
              />
              <div className={styles.statFooter}>
                <span>
                  最长 {streakData?.longestStreak ?? 0} 天
                </span>
              </div>
            </div>
          </div>
        </CollapseCard>
      </section>

      {/* ====== Middle Row: Mastery Ring + Recent Questions ====== */}
      <div className={styles.middleRow}>
        {/* Mastery Ring */}
        <div className={styles.masteryCard}>
          <h3 className={styles.masteryCardTitle}>掌握进度</h3>
          <div className={styles.ringContainer}>
            <MasteryRing
              percent={masteryRate}
              masteredCount={masteredCount}
              totalCount={questions.length}
            />
            <div className={styles.masteryBreakdown}>
              {masteryDistribution.map((item) => (
                <div key={item.label} className={styles.masteryItem}>
                  <span
                    className={styles.masteryDot}
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={styles.masteryItemLabel}>{item.label}</span>
                  <span className={styles.masteryItemCount}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Questions */}
        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <h3 className={styles.recentTitle}>
              {todayCount > 0 ? '今日待复习' : '最近录入'}
            </h3>
            <Link
              to={todayCount > 0 ? '/practice' : '/questions'}
              className={styles.recentViewAll}
            >
              查看全部
              <ChevronRightIcon />
            </Link>
          </div>

          {recentQuestions.length > 0 ? (
            <div className={styles.questionList}>
              {recentQuestions.map((q) => (
                <div key={q.id} className={styles.questionItem}>
                  <span className={styles.questionSubjectBadge}>
                    {q.subject}
                  </span>
                  <div className={styles.questionMain}>
                    <div className={styles.questionContent}>
                      <MarkdownInline content={q.content} />
                    </div>
                    {/* Tags */}
                    {q.tags && q.tags.length > 0 && (
                      <div className={styles.questionItemTags}>
                        {q.tags.slice(0, 2).map((t) => (
                          <span key={t.tag.id} className={styles.questionItemTag}>
                            {t.tag.name}
                          </span>
                        ))}
                        {q.tags.length > 2 && (
                          <span className={styles.questionItemTagMore}>
                            +{q.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    <div className={styles.questionMeta}>
                      <span className={styles.questionDate}>
                        {new Date(q.createdAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <span className={`${styles.masteryBadge} ${getMasteryBadgeClass(q.masteryLevel)}`}>
                    {MASTERY_LABELS[q.masteryLevel]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyRecent}>
              <div className={styles.emptyIcon}>
                <FileTextOutlined />
              </div>
              <p className={styles.emptyText}>暂无题目</p>
              <p className={styles.emptySubtext}>
                开始录入你的第一道错题吧
              </p>
              <button
                className={styles.emptyAction}
                onClick={() => navigate('/import')}
              >
                <PlusOutlined />
                <span>开始录入</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
