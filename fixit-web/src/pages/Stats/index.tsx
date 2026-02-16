import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  BookOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowRightOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import {
  reviewApi,
  ReviewStats,
  HeatmapData,
  StreakData,
  CalendarData,
} from '../../api/review';
import { useUserStore } from '../../stores/userStore';
import styles from './Stats.module.css';

// ============================================================
// Constants
// ============================================================

const MASTERY_LABELS = ['未学', '初学', '熟悉', '掌握', '精通', '专家'];

const MASTERY_RING_COLORS = [
  '#d4d4d0', // 未学
  '#e8c9a0', // 初学 - learning
  '#a8d4e6', // 熟悉 - familiar
  '#7ec8a8', // 掌握 - mastered
  '#c9a8e8', // 精通 - expert
  '#d4a574', // 专家 - accent
];

const HEATMAP_COLORS = [
  'var(--fi-border-subtle, #e5e7eb)',  // 无数据 - 亮色下用浅灰色
  'var(--fi-brand-dim, rgba(255, 107, 107, 0.25))',  // 少量
  'rgba(255, 107, 107, 0.5)',         // 较少
  'rgba(255, 107, 107, 0.75)',        // 较多
  'var(--fi-brand, #ff6b6b)',          // 频繁
];

// ============================================================
// Heatmap Component
// ============================================================

function Heatmap({ data }: { data: HeatmapData[] }) {
  const heatmapMap = useMemo(
    () => new Map(data.map((d) => [d.date, d])),
    [data]
  );

  // Detect if mobile screen
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { days, weeks, monthLabels, monthlyData } = useMemo(() => {
    const today = new Date();
    const daysToShow = isMobile ? 90 : 365; // Mobile: 3 months, Desktop: 1 year
    const allDays: { date: string; intensity: number; count: number }[] = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = heatmapMap.get(dateStr);
      allDays.push({
        date: dateStr,
        intensity: dayData?.intensity || 0,
        count: dayData?.count || 0,
      });
    }

    const allWeeks: { days: typeof allDays }[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      allWeeks.push({ days: allDays.slice(i, i + 7) });
    }
    while (allWeeks.length > 53) {
      allWeeks.shift();
    }

    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月',
    ];

    let currentMonth = -1;
    const labels: { month: string; weekIndex: number }[] = [];
    allWeeks.forEach((week, index) => {
      const firstDay = week.days[0];
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth();
        if (month !== currentMonth) {
          labels.push({ month: monthNames[month], weekIndex: index });
          currentMonth = month;
        }
      }
    });

    // Monthly stats for mobile
    const monthlyStats: { month: string; total: number; days: number }[] = [];
    const monthMap = new Map<string, number>();

    allDays.forEach(day => {
      if (day.count > 0) {
        const monthKey = day.date.substring(0, 7); // YYYY-MM
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + day.count);
      }
    });

    monthMap.forEach((total, monthKey) => {
      const [year, month] = monthKey.split('-');
      monthlyStats.push({
        month: `${parseInt(month)}月`,
        total,
        days: allDays.filter(d => d.date.startsWith(monthKey) && d.count > 0).length
      });
    });

    monthlyStats.sort((a, b) => {
      const monthOrder = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    return {
      days: allDays,
      weeks: allWeeks,
      monthLabels: labels,
      monthlyData: monthlyStats
    };
  }, [heatmapMap, isMobile]);

  const totalReviews = useMemo(
    () => days.reduce((sum, d) => sum + d.count, 0),
    [days]
  );

  const weekWidth = isMobile ? 10 : 15; // Smaller cells on mobile

  // Mobile: show monthly summary instead of full grid
  if (isMobile) {
    return (
      <div className={styles.heatmapMobile}>
        <div className={styles.heatmapMobileHeader}>
          <span className={styles.heatmapMobileTitle}>学习记录</span>
          <span className={styles.heatmapMobileTotal}>共 {totalReviews} 次</span>
        </div>
        <div className={styles.heatmapMobileList}>
          {monthlyData.length > 0 ? monthlyData.map((item, index) => (
            <div key={index} className={styles.heatmapMobileItem}>
              <span className={styles.heatmapMobileMonth}>{item.month}</span>
              <div className={styles.heatmapMobileBars}>
                <div className={styles.heatmapMobileBarBg}>
                  <div
                    className={styles.heatmapMobileBarFill}
                    style={{
                      width: `${Math.min((item.total / Math.max(...monthlyData.map(d => d.total))) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
              <span className={styles.heatmapMobileCount}>{item.total}次</span>
            </div>
          )) : (
            <div className={styles.heatmapMobileEmpty}>暂无学习记录</div>
          )}
        </div>
        <div className={styles.heatmapMobileLegend}>
          <span>近3个月数据</span>
        </div>
      </div>
    );
  }

  // Desktop: full heatmap grid
  return (
    <div className={styles.heatmapContainer}>
      <div className={styles.heatmapInner}>
        {/* Month labels */}
        <div className={styles.heatmapMonths}>
          <div className={styles.heatmapMonthSpacer} />
          {monthLabels.map((label, i) => {
            const leftPos = label.weekIndex === 0 ? 24 : 24 + (label.weekIndex * weekWidth);
            return (
              <div
                key={i}
                className={styles.heatmapMonthLabel}
                style={{ position: 'absolute', left: `${leftPos}px` }}
              >
                {label.month}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className={styles.heatmapBody}>
          <div className={styles.heatmapWeekLabels}>
            <span className={styles.heatmapWeekLabel} />
            <span className={styles.heatmapWeekLabel}>Mon</span>
            <span className={styles.heatmapWeekLabel} />
            <span className={styles.heatmapWeekLabel}>Wed</span>
            <span className={styles.heatmapWeekLabel} />
            <span className={styles.heatmapWeekLabel}>Fri</span>
            <span className={styles.heatmapWeekLabel} />
          </div>

          <div className={styles.heatmapWeeks}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className={styles.heatmapWeekCol}>
                {week.days.map((day) => (
                  <Tooltip
                    key={day.date}
                    title={`${day.date}: ${day.count} 次复习`}
                  >
                    <div
                      className={styles.heatmapCell}
                      style={{
                        backgroundColor: HEATMAP_COLORS[day.intensity] || HEATMAP_COLORS[0],
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className={styles.heatmapLegend}>
          <span>过去一年共 {totalReviews} 次复习</span>
          <span style={{ margin: '0 4px' }}>|</span>
          <span>少</span>
          {HEATMAP_COLORS.map((color, i) => (
            <div
              key={i}
              className={styles.heatmapLegendCell}
              style={{ backgroundColor: color }}
            />
          ))}
          <span>多</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Ring Chart Component (SVG)
// ============================================================

interface RingSegment {
  label: string;
  count: number;
  color: string;
  percentage: number;
}

function RingChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: RingSegment[];
  centerValue: string;
  centerLabel: string;
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const radius = 70;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  // Calculate offsets for each segment
  let currentOffset = 0;
  const arcs = segments
    .filter((s) => s.percentage > 0)
    .map((segment) => {
      const dashLength = (segment.percentage / 100) * circumference;
      const arc = {
        ...segment,
        dashLength,
        dashOffset: circumference - currentOffset,
      };
      currentOffset += dashLength;
      return arc;
    });

  return (
    <div className={styles.ringChartContainer}>
      <svg className={styles.ringChart} viewBox="0 0 180 180">
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="var(--fi-bg-tertiary, #2a2a2d)"
          strokeWidth={strokeWidth}
        />
        {/* Data segments */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            className={styles.ringSegment}
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${animated ? arc.dashLength : 0} ${circumference}`}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className={styles.ringCenter}>
        <div className={styles.ringCenterValue}>{centerValue}</div>
        <div className={styles.ringCenterLabel}>{centerLabel}</div>
      </div>
    </div>
  );
}

// ============================================================
// Monthly Calendar Component
// ============================================================

function MonthlyCalendar({
  data,
  year,
  month,
  onChange,
}: {
  data: CalendarData;
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  const { days, weekDays } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

    const result: { day: number; date: string; count: number }[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      result.push({ day: 0, date: '', count: 0 });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      result.push({
        day: i,
        date: dateStr,
        count: data[dateStr]?.count || 0,
      });
    }

    return {
      days: result,
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    };
  }, [data, year, month]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const handlePrevMonth = useCallback(() => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  }, [year, month, onChange]);

  const handleNextMonth = useCallback(() => {
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  }, [year, month, onChange]);

  const getDayClassName = (d: { day: number; date: string; count: number }) => {
    if (d.day === 0) return styles.calendarDayEmpty;

    const classes: string[] = [];

    if (d.count > 0) {
      classes.push(styles.calendarDayHasData);
      if (d.count >= 5) {
        classes.push(styles.calendarDayHeavy);
      } else if (d.count >= 3) {
        classes.push(styles.calendarDayMedium);
      } else {
        classes.push(styles.calendarDayLight);
      }
    } else {
      classes.push(styles.calendarDayActive);
    }

    if (d.date === todayStr) {
      classes.push(styles.calendarDayToday);
    }

    return classes.join(' ');
  };

  return (
    <div>
      <div className={styles.calendarNav}>
        <button
          className={styles.calendarNavBtn}
          onClick={handlePrevMonth}
          type="button"
        >
          <LeftOutlined />
        </button>
        <span className={styles.calendarNavTitle}>
          {year} 年 {month} 月
        </span>
        <button
          className={styles.calendarNavBtn}
          onClick={handleNextMonth}
          type="button"
        >
          <RightOutlined />
        </button>
      </div>

      <div className={styles.calendarGrid}>
        {weekDays.map((wd) => (
          <div key={wd} className={styles.calendarWeekday}>
            {wd}
          </div>
        ))}
        {days.map((d, i) => (
          <Tooltip
            key={i}
            title={d.day > 0 ? `${d.date}: ${d.count} 次复习` : undefined}
          >
            <div className={getDayClassName(d)}>
              {d.day > 0 ? d.day : ''}
            </div>
          </Tooltip>
        ))}
      </div>

      <div className={styles.calendarLegend}>
        <div className={styles.calendarLegendItem}>
          <div
            className={styles.calendarLegendDot}
            style={{ background: 'var(--fi-brand, #ff6b6b)' }}
          />
          <span>5+ 次</span>
        </div>
        <div className={styles.calendarLegendItem}>
          <div
            className={styles.calendarLegendDot}
            style={{ background: 'rgba(255, 107, 107, 0.5)' }}
          />
          <span>3-4 次</span>
        </div>
        <div className={styles.calendarLegendItem}>
          <div
            className={styles.calendarLegendDot}
            style={{ background: 'var(--fi-brand-dim, rgba(255, 107, 107, 0.25))' }}
          />
          <span>1-2 次</span>
        </div>
        <div className={styles.calendarLegendItem}>
          <div
            className={styles.calendarLegendDot}
            style={{ background: 'var(--fi-bg-tertiary, #2a2a2d)' }}
          />
          <span>无</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Stats Page
// ============================================================

export default function StatsPage() {
  const navigate = useNavigate();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [calendarDate, setCalendarDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, heatmapRes, streakRes, calendarRes] = await Promise.all([
        reviewApi.getStats().catch(() => ({ data: null })),
        reviewApi.getHeatmap().catch(() => ({ data: [] })),
        reviewApi.getStreak().catch(() => ({ data: null })),
        reviewApi
          .getCalendar(calendarDate.year, calendarDate.month)
          .catch(() => ({ data: {} })),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      setHeatmapData(heatmapRes.data);
      if (streakRes.data) setStreakData(streakRes.data);
      setCalendarData(calendarRes.data);
    } catch (error) {
      // Silently handle fetch errors - data will remain in default state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reviewApi.getCalendar(calendarDate.year, calendarDate.month).then((res) => {
      setCalendarData(res.data);
    });
  }, [calendarDate]);

  // Derived data
  const {
    masteryRate,
    masteredCount,
    distributionData,
    ringSegments,
  } = useMemo(() => {
    const dist = (stats?.masteryDistribution || []).map((d) => ({
      level: d.level,
      label: MASTERY_LABELS[d.level],
      count: d.count,
      color: MASTERY_RING_COLORS[d.level],
      percentage:
        (stats?.totalQuestions || 0) > 0
          ? Math.round((d.count / stats!.totalQuestions) * 100)
          : 0,
    }));

    // Fill missing levels
    for (let i = 0; i <= 5; i++) {
      if (!dist.find((d) => d.level === i)) {
        dist.push({
          level: i,
          label: MASTERY_LABELS[i],
          count: 0,
          color: MASTERY_RING_COLORS[i],
          percentage: 0,
        });
      }
    }
    dist.sort((a, b) => a.level - b.level);

    const mastered = dist
      .filter((d) => d.level >= 3)
      .reduce((sum, d) => sum + d.count, 0);
    const rate =
      (stats?.totalQuestions || 0) > 0
        ? Math.round((mastered / stats!.totalQuestions) * 100)
        : 0;

    const rings: RingSegment[] = dist
      .filter((d) => d.count > 0)
      .map((d) => ({
        label: d.label,
        count: d.count,
        color: d.color,
        percentage: d.percentage,
      }));

    return {
      masteryRate: rate,
      masteredCount: mastered,
      distributionData: dist,
      ringSegments: rings,
    };
  }, [stats]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ====== Header ====== */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <Link to="/">
              <button className={styles.backBtn} type="button">
                <ArrowLeftOutlined />
              </button>
            </Link>
            <div>
              <h1 className={styles.pageTitle}>
                数据统计
                <span className={styles.pageTitleAccent}>Statistics</span>
              </h1>
            </div>
          </div>

          <div className={styles.quickActions}>
            <button
              className={styles.quickActionBtnPrimary}
              onClick={() => navigate('/practice')}
              disabled={(stats?.dueToday || 0) === 0}
              type="button"
            >
              <CheckCircleOutlined />
              {(stats?.dueToday || 0) > 0
                ? `开始复习 (${stats?.dueToday}题)`
                : '今日已完成'}
            </button>
            <button
              className={styles.quickActionBtn}
              onClick={() => navigate('/questions')}
              type="button"
            >
              <EditOutlined />
              管理题目
            </button>
            <button
              className={styles.quickActionBtn}
              onClick={() => navigate('/import')}
              type="button"
            >
              <PlusOutlined />
              录入新题
            </button>
          </div>
        </div>
      </div>

      {/* ====== Main Content ====== */}
      <div className={styles.main}>
        {/* Data Cards */}
        <div
          className={`${styles.dataCardsGrid} ${styles.staggerItem}`}
          style={{ animationDelay: '0ms' }}
        >
          <div className={styles.dataCardDark}>
            <div className={styles.dataCardLabel}>
              <BookOutlined style={{ marginRight: 6 }} />
              总题目数
            </div>
            <div className={styles.dataCardValue}>
              {stats?.totalQuestions || 0}
            </div>
            <div className={styles.dataCardSub}>
              已掌握 {masteredCount} 题
            </div>
          </div>

          <div className={styles.dataCardWarm}>
            <div className={styles.dataCardLabel}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              今日待复习
            </div>
            <div className={styles.dataCardValue}>
              {stats?.dueToday || 0}
              <span className={styles.dataCardSuffix}>题</span>
            </div>
            <div className={styles.dataCardSub}>
              本周 {stats?.thisWeekReviews || 0} 次
            </div>
          </div>

          <div className={styles.dataCardCool}>
            <div className={styles.dataCardLabel}>
              <FireOutlined style={{ marginRight: 6 }} />
              连续学习
            </div>
            <div className={styles.dataCardValue}>
              {streakData?.currentStreak || 0}
              <span className={styles.dataCardSuffix}>天</span>
            </div>
            <div className={styles.dataCardSub}>
              最长 {streakData?.longestStreak || 0} 天
            </div>
          </div>

          <div className={styles.dataCardGreen}>
            <div className={styles.dataCardLabel}>
              <TrophyOutlined style={{ marginRight: 6 }} />
              掌握率
            </div>
            <div className={styles.dataCardValue}>
              {masteryRate}
              <span className={styles.dataCardSuffix}>%</span>
            </div>
            <div className={styles.dataCardSub}>
              累计学习 {streakData?.totalDays || 0} 天
            </div>
          </div>
        </div>

        {/* Heatmap + Study Stats */}
        <div
          className={`${styles.twoColGrid} ${styles.staggerItem}`}
          style={{ animationDelay: '100ms' }}
        >
          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              <div className={styles.sectionTitleDot} />
              学习热力图
            </div>
            <Heatmap data={heatmapData} />
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              <div className={styles.sectionTitleDot} />
              学习概览
            </div>
            <div className={styles.studyStatsList}>
              <div className={styles.studyStatItem}>
                <span className={styles.studyStatLabel}>本周复习</span>
                <span className={styles.studyStatValue}>
                  {stats?.thisWeekReviews || 0}
                  <span className={styles.studyStatSuffix}>次</span>
                </span>
              </div>
              <div className={styles.studyStatItem}>
                <span className={styles.studyStatLabel}>累计学习</span>
                <span className={styles.studyStatValue}>
                  {streakData?.totalDays || 0}
                  <span className={styles.studyStatSuffix}>天</span>
                </span>
              </div>
              <div className={styles.studyStatItem}>
                <span className={styles.studyStatLabel}>最长连续</span>
                <span className={styles.studyStatValue}>
                  {streakData?.longestStreak || 0}
                  <span className={styles.studyStatSuffix}>天</span>
                </span>
              </div>
              <div className={styles.studyStatItem}>
                <span className={styles.studyStatLabel}>最后学习</span>
                <span
                  className={styles.studyStatValue}
                  style={{ fontSize: 16 }}
                >
                  {streakData?.lastReviewDate
                    ? new Date(streakData.lastReviewDate).toLocaleDateString(
                        'zh-CN'
                      )
                    : '暂无'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mastery Distribution + Calendar */}
        <div
          className={`${styles.twoColGridEqual} ${styles.staggerItem}`}
          style={{ animationDelay: '200ms' }}
        >
          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              <div className={styles.sectionTitleDot} />
              掌握程度分布
            </div>
            <div className={styles.masterySection}>
              <RingChart
                segments={ringSegments}
                centerValue={`${masteryRate}%`}
                centerLabel="掌握率"
              />
              <div className={styles.masteryBars}>
                {distributionData.map((item) => (
                  <div key={item.level} className={styles.masteryBarItem}>
                    <div
                      className={styles.masteryBarDot}
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={styles.masteryBarLabel}>{item.label}</span>
                    <div className={styles.masteryBarTrack}>
                      <div
                        className={styles.masteryBarFill}
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className={styles.masteryBarCount}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              <div className={styles.sectionTitleDot} />
              月度复习记录
            </div>
            <MonthlyCalendar
              data={calendarData}
              year={calendarDate.year}
              month={calendarDate.month}
              onChange={(y, m) => setCalendarDate({ year: y, month: m })}
            />
          </div>
        </div>

        {/* Learning Tips */}
        <div
          className={styles.staggerItem}
          style={{ animationDelay: '300ms' }}
        >
          <div className={styles.sectionTitle} style={{ marginTop: 8 }}>
            <div className={styles.sectionTitleDot} />
            学习建议
          </div>
          <div className={styles.tipsGrid}>
            {/* Tip: Due Today */}
            {(stats?.dueToday || 0) > 0 ? (
              <div className={styles.tipCardWarm}>
                <div className={`${styles.tipIconBox} ${styles.tipIconWarm}`}>
                  <WarningOutlined />
                </div>
                <div className={styles.tipTitle}>今日待复习</div>
                <p className={styles.tipDescription}>
                  你有 {stats?.dueToday || 0}{' '}
                  道题目需要复习，按时复习可以加深记忆印象。
                </p>
                <button
                  className={styles.tipActionWarm}
                  onClick={() => navigate('/practice')}
                  type="button"
                >
                  立即复习 <ArrowRightOutlined />
                </button>
              </div>
            ) : (
              <div className={styles.tipCardGreen}>
                <div className={`${styles.tipIconBox} ${styles.tipIconGreen}`}>
                  <CheckCircleOutlined />
                </div>
                <div className={styles.tipTitle}>今日复习完成</div>
                <p className={styles.tipDescription}>
                  今日复习任务已全部完成，继续保持这个节奏！
                </p>
              </div>
            )}

            {/* Tip: Streak */}
            {(streakData?.currentStreak || 0) >= 7 && (
              <div className={styles.tipCardPurple}>
                <div
                  className={`${styles.tipIconBox} ${styles.tipIconPurple}`}
                >
                  <FireOutlined />
                </div>
                <div className={styles.tipTitle}>
                  连续学习 {streakData?.currentStreak || 0} 天
                </div>
                <p className={styles.tipDescription}>
                  你的学习习惯正在养成！距离稳定习惯还差{' '}
                  {Math.max(0, 21 - (streakData?.currentStreak || 0))} 天。
                </p>
              </div>
            )}

            {/* Tip: Low mastery */}
            {masteryRate < 30 && (stats?.totalQuestions || 0) > 0 && (
              <div className={styles.tipCardBlue}>
                <div className={`${styles.tipIconBox} ${styles.tipIconBlue}`}>
                  <RiseOutlined />
                </div>
                <div className={styles.tipTitle}>提升空间很大</div>
                <p className={styles.tipDescription}>
                  继续录入新题目并坚持复习，掌握程度会逐步提升。
                </p>
              </div>
            )}

            {/* Tip: High mastery */}
            {masteryRate >= 70 && (stats?.totalQuestions || 0) > 0 && (
              <div className={styles.tipCardPurple}>
                <div
                  className={`${styles.tipIconBox} ${styles.tipIconPurple}`}
                >
                  <TrophyOutlined />
                </div>
                <div className={styles.tipTitle}>学习成效显著</div>
                <p className={styles.tipDescription}>
                  你已经掌握了大部分题目！坚持定期复习，让知识更加牢固。
                </p>
              </div>
            )}

            {/* Tip: Ebbinghaus */}
            <div className={styles.tipCardNeutral}>
              <div className={`${styles.tipIconBox} ${styles.tipIconNeutral}`}>
                <BookOutlined />
              </div>
              <div className={styles.tipTitle}>艾宾浩斯复习法</div>
              <ul className={styles.tipList}>
                <li>初次学习后 1 天内复习效果最佳</li>
                <li>掌握后间隔逐渐延长 (1/3/7/14/30 天)</li>
                <li>标记为 "没做对" 会重新安排到明天</li>
                <li>标记为 "完全掌握" 会延长间隔时间</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
