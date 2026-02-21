// pages/PracticeHistory/index.tsx
// 题目练习历史页面 - 艺术感编辑风格

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { reviewApi, QuestionPracticeStats, QuestionPracticeHistoryItem } from '../../api/review';
import { questionApi } from '../../api/question';
import { useUIStore } from '../../stores/uiStore';
import styles from './PracticeHistory.module.css';

// 格式化为 YYYY-MM-DD HH:mm:ss
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function PracticeHistoryPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const theme = useUIStore((state) => state.theme);

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<{ id: string; subject: string; content: string } | null>(null);
  const [stats, setStats] = useState<QuestionPracticeStats | null>(null);
  const [history, setHistory] = useState<QuestionPracticeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // 获取题目信息和统计数据
  useEffect(() => {
    if (!questionId) {
      message.error('缺少题目 ID');
      navigate('/questions');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取题目信息
        const questionRes = await questionApi.get(questionId);
        setQuestion(questionRes.data);

        // 获取统计数据
        const statsRes = await reviewApi.getQuestionPracticeStats(questionId);
        setStats(statsRes.data);

        // 获取历史记录
        const historyRes = await reviewApi.getQuestionPracticeHistory(questionId, 1, 10);
        setHistory(historyRes.data.data);
        setHistoryTotal(historyRes.data.total);
      } catch (error: any) {
        message.error(error.response?.data?.message || '获取数据失败');
        navigate('/questions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionId, navigate]);

  // 加载更多历史记录
  const handleLoadMore = useCallback(async () => {
    if (!questionId || historyLoading) return;

    setHistoryLoading(true);
    const nextPage = historyPage + 1;

    try {
      const res = await reviewApi.getQuestionPracticeHistory(questionId, nextPage, 10);
      setHistory((prev) => [...prev, ...res.data.data]);
      setHistoryPage(nextPage);
      setHistoryTotal(res.data.total);
    } catch (error) {
      message.error('加载更多失败');
    } finally {
      setHistoryLoading(false);
    }
  }, [questionId, historyPage, historyLoading]);

  if (loading) {
    return (
      <div className={`${styles.container} ${styles[theme]}`}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!question || !stats) {
    return null;
  }

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      {/* 返回按钮 */}
      <div className={styles.backBar}>
        <Link to="/questions" className={styles.backBtn}>
          <ArrowLeftOutlined />
          <span>返回题库</span>
        </Link>
      </div>

      {/* 艺术感编辑风格布局 */}
      <div className={styles.maxWrapper}>
        <div className={styles.grid}>
          {/* 左侧：标题和统计 */}
          <div className={styles.leftCol}>
            <div className={styles.sticky}>
              <div className={styles.metaSection}>
                <div className={styles.metaDivider}>
                  <span className={styles.metaLine} />
                  <p className={styles.metaLabel}>{question.subject}</p>
                </div>
                <h1 className={styles.mainTitle}>
                  练习<span className={styles.titleItalic}>历程</span>
                </h1>
                <p className={styles.metaDesc}>
                  回顾这道题目的练习轨迹，了解掌握程度的变化过程，温故而知新。
                </p>
              </div>

              {/* 统计数据 */}
              <div className={styles.statsSection}>
                <div className={styles.statTotal}>
                  <p className={styles.statLabel}>总练习次数</p>
                  <p className={styles.statTotalValue}>{stats.totalPracticeCount}</p>
                </div>
                <div className={styles.statRow}>
                  <div className={styles.statItem}>
                    <p className={styles.statLabelSmall}>忘记</p>
                    <p className={styles.statValueForgot}>{stats.forgottenCount}</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statLabelSmall}>有点模糊</p>
                    <p className={styles.statValueFuzzy}>{stats.fuzzyCount}</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statLabelSmall}>掌握</p>
                    <p className={styles.statValueMastered}>{stats.masteredCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：时间线 */}
          <div className={styles.rightCol}>
            <div className={styles.timeline}>
              {history.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={styles.emptyTitle}>暂无记录</p>
                  <p className={styles.emptyDesc}>开始练习以记录学习轨迹</p>
                </div>
              ) : (
                <>
                  <div className={styles.recordsHeader}>
                    <span className={styles.recordsTitle}>练习记录</span>
                    <span className={styles.recordsCount}>{historyTotal}</span>
                  </div>
                  <div className={styles.recordsList}>
                    {history.map((item) => {
                      const [datePart, timePart] = formatDateTime(item.createdAt).split(' ');
                      const statusConfig = {
                        FORGOTTEN: { label: '没做对', type: 'forgot' },
                        FUZZY: { label: '有点模糊', type: 'fuzzy' },
                        MASTERED: { label: '完全掌握', type: 'mastered' },
                      };
                      const config = statusConfig[item.status];

                      return (
                        <div key={item.id} className={styles.recordItem}>
                          <div className={styles.recordMeta}>
                            <div className={styles.recordDateTime}>
                              <p className={styles.recordDate}>{datePart}</p>
                              <p className={styles.recordTime}>{timePart}</p>
                            </div>
                            <div className={`${styles.recordStatus} ${styles[`recordStatus${config.type}`]}`}>
                              <span className={`${styles.statusDot} ${styles[`statusDot${config.type}`]}`} />
                              {config.label}
                            </div>
                          </div>
                          <div className={styles.recordContent}>
                            {item.note ? (
                              <div className={styles.recordNote}>
                                <span className={styles.quoteMark}>"</span>
                                <p className={styles.noteText}>{item.note}</p>
                              </div>
                            ) : (
                              <div className={styles.recordEmpty}>
                                <p>未留下心得笔记...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {history.length < historyTotal && (
                    <div className={styles.loadMore}>
                      {historyLoading ? (
                        <div className={styles.loadingSmall} />
                      ) : (
                        <button onClick={handleLoadMore}>加载更多</button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
