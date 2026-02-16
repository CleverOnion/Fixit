import { useState, useEffect } from 'react';
import { Table, Button, message, Modal, Tag, Typography, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { invitationApi, InvitationCode } from '../api/invitation';
import styles from './Invitation.module.css';

const { Title, Text } = Typography;

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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('已复制到剪贴板');
  };

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
          <Tag color="green">已使用</Tag>
        ) : (
          <Tag color="blue">未使用</Tag>
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title level={3}>邀请码管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          style={{ background: '#ff6b6b', borderColor: '#ff6b6b' }}
        >
          创建邀请码
        </Button>
      </div>

      <div className={styles.content}>
        <Table
          dataSource={invitations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
}
