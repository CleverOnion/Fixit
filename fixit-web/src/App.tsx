import { useEffect, lazy, Suspense, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/Common';
import { useUserStore } from './stores/userStore';
import { useUIStore } from './stores/uiStore';
import { Loading } from './components/Common';
import { reviewApi } from './api/review';

// 懒加载页面组件 - 代码分割优化
const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/Register'));
const HomePage = lazy(() => import('./pages/Home'));
const ImportPage = lazy(() => import('./pages/Import'));
const QuestionsPage = lazy(() => import('./pages/Questions'));
const EditQuestionPage = lazy(() => import('./pages/Questions/Edit'));
const PracticePage = lazy(() => import('./pages/Practice'));
const StatsPage = lazy(() => import('./pages/Stats'));
const InvitationPage = lazy(() => import('./pages/Invitation'));

// 懒加载fallback
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loading />
    </div>
  );
}

function AuthInitializer() {
  const fetchProfile = useUserStore((state) => state.fetchProfile);
  const token = useUserStore((state) => state.token);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return null;
}

function PrivateOutlet() {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [todayCount, setTodayCount] = useState(0);

  const fetchTodayCount = useCallback(async () => {
    try {
      const res = await reviewApi.getTodayCount();
      setTodayCount(res.data.count);
    } catch {
      setTodayCount(0);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTodayCount();
    }
  }, [isLoggedIn, fetchTodayCount]);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <Layout todayCount={todayCount}>
      <Outlet />
    </Layout>
  );
}

function PublicOutlet() {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  if (isLoggedIn) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

export default function App() {
  const theme = useUIStore((state) => state.theme);

  // 同步主题状态到 DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 动态主题配置
  const isLight = theme === 'day';

  const themeConfig = {
    token: {
      colorPrimary: '#ff6b6b',
      colorSuccess: '#10b981',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorInfo: '#06b6d4',
      borderRadius: 10,
      colorBgContainer: isLight ? '#ffffff' : '#1a1a1b',
      colorBgElevated: isLight ? '#ffffff' : '#232326',
      colorBgLayout: isLight ? '#f8f9fa' : '#0d0d0e',
      colorText: isLight ? '#111827' : '#f5f5f7',
      colorTextSecondary: isLight ? '#6b7280' : '#a1a1a6',
      colorTextTertiary: isLight ? '#9ca3af' : '#6b6b70',
      colorBorder: isLight ? '#d1d5db' : '#36363a',
      colorBorderSecondary: isLight ? '#e5e7eb' : '#2a2a2d',
    },
    components: {
      Button: {
        colorPrimary: '#ff6b6b',
        algorithm: !isLight,
      },
      Input: {
        colorBgContainer: isLight ? '#f3f4f6' : '#232326',
        colorBorder: isLight ? '#d1d5db' : '#36363a',
        colorText: isLight ? '#111827' : '#f5f5f7',
        colorTextPlaceholder: isLight ? '#d1d5db' : '#52525b',
      },
      Select: {
        colorBgContainer: isLight ? '#f3f4f6' : '#232326',
        colorBorder: isLight ? '#d1d5db' : '#36363a',
        colorText: isLight ? '#111827' : '#f5f5f7',
      },
      Card: {
        colorBgContainer: isLight ? '#ffffff' : '#1a1a1b',
        colorBorder: isLight ? '#e5e7eb' : '#2a2a2d',
      },
      Modal: {
        colorBgContainer: isLight ? '#ffffff' : '#1a1a1b',
        colorBorder: isLight ? '#e5e7eb' : '#2a2a2d',
      },
    },
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthInitializer />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<PublicOutlet />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
              <Route element={<PrivateOutlet />}>
                <Route path="/import" element={<ImportPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/questions/:id" element={<EditQuestionPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/invitation" element={<InvitationPage />} />
                <Route path="/" element={<HomePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </ConfigProvider>
  );
}
