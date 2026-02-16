// pages/Login.tsx
// Login Page - "静谧之境" 深色主题高级设计

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useUserStore } from '../stores/userStore';
import styles from './Login.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || '登录失败，请稍后重试';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* 背景装饰 */}
      <div className={styles.glowOrb} />
      <div className={styles.glowOrb2} />

      <div className={styles.container}>
        {/* Logo 区域 */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
              <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#ff6b6b" />
                  <stop offset="1" stopColor="#e54d2e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>Fixit</span>
        </div>

        {/* 标题 */}
        <div className={styles.header}>
          <h1 className={styles.title}>欢迎回来</h1>
          <p className={styles.subtitle}>继续你的错题管理之旅</p>
        </div>

        {/* 表单 */}
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          className={styles.form}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <div className={styles.inputWrapper}>
              <MailOutlined className={styles.inputIcon} />
              <input
                className={styles.input}
                type="email"
                placeholder="邮箱地址"
                autoComplete="email"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <div className={styles.inputWrapper}>
              <LockOutlined className={styles.inputIcon} />
              <input
                className={styles.input}
                type="password"
                placeholder="密码"
                autoComplete="current-password"
              />
            </div>
          </Form.Item>

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password" className={styles.forgotLink}>忘记密码？</Link>
          </div>

          <Form.Item>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loadingState}>
                  <span className={styles.spinner} />
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </Form.Item>
        </Form>

        {/* 底部链接 */}
        <p className={styles.footer}>
          还没有账号？<Link to="/register" className={styles.link}>立即注册</Link>
        </p>
      </div>
    </div>
  );
}
