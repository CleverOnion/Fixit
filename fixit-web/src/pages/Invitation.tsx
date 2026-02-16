import { useState, useEffect } from 'react';
import { Table, Button, message, Modal, Tag, Space, Typography } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { invitationApi, InvitationCode } from '../api/invitation';
import styles from './Invitation.module.css';

const { Text } = Typography;

// 复制到剪贴板
const copyToClipboard = (code: string) => {
  navigator.clipboard.writeText(code);
  message.success('已复制到剪贴板');
};

export default function InvitationPage() {
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await invitationApi.list();
      setInvitations(res.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取邀请码失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCreate = async () => {
    try {
      await invitationApi.create();
      message.success('邀请码创建成功');
      fetchInvitations();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建邀请码失败');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个邀请码吗？删除后无法恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await invitationApi.delete(id);
          message.success('删除成功');
          fetchInvitations();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除邀请码失败');
        }
      },
    });
  };

  // 桌面端表格列定义
  const columns = [
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <Text strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{code}</Text>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(code)}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'usedBy',
      key: 'used',
      render: (usedBy: string | null) => (
        usedBy ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>已使用</Tag>
        ) : (
          <Tag color="blue" icon={<ClockCircleOutlined />}>未使用</Tag>
        )
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: (time: string | null) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InvitationCode) => (
        !record.usedBy && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        )
      ),
    },
  ];

  // 移动端卡片渲染
  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>loading</div>
        </div>
      );
    }

    if (invitations.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>+</div>
          <div className={styles.emptyTitle}>暂无邀请码</div>
          <div className={styles.emptyDesc}>点击上方按钮创建邀请码</div>
        </div>
      );
    }

    return (
      <div className={styles.cardList}>
        {invitations.map((item) => (
          <div key={item.id} className={styles.cardItem}>
            <div className={styles.cardHeader}>
              <div className={styles.cardCodeRow}>
                <span className={styles.cardCode}>{item.code}</span>
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  className={styles.cardCopyBtn}
                  onClick={() => copyToClipboard(item.code)}
                />
              </div>
              {item.usedBy ? (
                <Tag color="green">已使用</Tag>
              ) : (
                <Tag color="blue">未使用</Tag>
              )}
            </div>
            <div className={styles.cardMeta}>
              <div className={styles.cardMetaRow}>
                <span className={styles.cardMetaLabel}>创建时间</span>
                <span className={styles.cardMetaValue}>
                  {new Date(item.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              {item.usedBy && (
                <div className={styles.cardMetaRow}>
                  <span className={styles.cardMetaLabel}>使用时间</span>
                  <span className={styles.cardMetaValue}>
                    {new Date(item.usedAt!).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
              {item.usedBy && (
                <div className={styles.cardMetaRow}>
                  <span className={styles.cardMetaLabel}>使用者</span>
                  <span className={styles.cardMetaValue}>{item.usedBy}</span>
                </div>
              )}
            </div>
            {!item.usedBy && (
              <div className={styles.cardActions}>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(item.id)}
                >
                  删除
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>邀请码管理</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          className={styles.createBtn}
        >
          创建邀请码
        </Button>
      </div>

      <div className={styles.content}>
        {/* 桌面端表格 */}
        <div className={styles.desktopTable}>
          <Table
            dataSource={invitations}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </div>

        {/* 移动端卡片列表 */}
        <div className={styles.mobileCards}>
          {renderMobileCards()}
        </div>
      </div>
    </div>
  );
}
