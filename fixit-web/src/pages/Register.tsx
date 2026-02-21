// pages/Register.tsx
// Register Page - "静谧之境" 深色主题高级设计

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { useUserStore } from '../stores/userStore';
import styles from './Register.module.css';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const register = useUserStore((state) => state.register);

  const onFinish = async (values: { email: string; password: string; nickname: string; invitationCode: string }) => {
    setLoading(true);
    try {
      await register(values.email, values.password, values.nickname, values.invitationCode);
      message.success('注册成功');
      navigate('/');
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '注册失败';
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
            <svg viewBox="0 0 32 32" fill="none" role="img" aria-label="Fixit Logo">
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
          <h1 className={styles.title}>创建账号</h1>
          <p className={styles.subtitle}>开始你的错题管理之旅</p>
        </div>

        {/* 表单 */}
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          className={styles.form}
        >
          <Form.Item
            name="nickname"
            label={<span className={styles.formLabel}>昵称</span>}
            rules={[{ required: true, message: '请输入昵称' }, { min: 2, message: '昵称至少2个字符' }]}
          >
            <div className={styles.inputWrapper}>
              <UserOutlined className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                type="text"
                placeholder="昵称"
                autoComplete="nickname"
                aria-label="昵称"
                id="register-nickname"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className={styles.formLabel}>邮箱地址</span>}
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <div className={styles.inputWrapper}>
              <MailOutlined className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                type="email"
                placeholder="邮箱地址"
                autoComplete="email"
                aria-label="邮箱地址"
                id="register-email"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className={styles.formLabel}>密码</span>}
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]}
          >
            <div className={styles.inputWrapper}>
              <LockOutlined className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                type="password"
                placeholder="密码"
                autoComplete="new-password"
                aria-label="密码"
                id="register-password"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span className={styles.formLabel}>确认密码</span>}
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <div className={styles.inputWrapper}>
              <LockOutlined className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                type="password"
                placeholder="确认密码"
                autoComplete="new-password"
                aria-label="确认密码"
                id="register-confirm-password"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="invitationCode"
            label={<span className={styles.formLabel}>邀请码</span>}
            rules={[{ required: true, message: '请输入邀请码' }]}
          >
            <div className={styles.inputWrapper}>
              <KeyOutlined className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                type="text"
                placeholder="邀请码"
                autoComplete="off"
                aria-label="邀请码"
                id="register-invitation-code"
              />
            </div>
          </Form.Item>

          <Form.Item>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loadingState}>
                  <span className={styles.spinner} />
                  注册中…
                </span>
              ) : (
                '注册'
              )}
            </button>
          </Form.Item>
        </Form>

        {/* 底部链接 */}
        <p className={styles.footer}>
          已有账号？<Link to="/login" className={styles.link}>立即登录</Link>
        </p>
      </div>
    </div>
  );
}
