// components/Common/ConfirmModal.tsx
// 确认对话框组件 - 简化版

import { Modal, Button } from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

type ConfirmType = 'delete' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  type?: ConfirmType;
  title?: string;
  content?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const iconMap: Record<ConfirmType, React.ReactNode> = {
  delete: <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 22 }} />,
  warning: <WarningOutlined style={{ color: '#faad14', fontSize: 22 }} />,
  success: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 22 }} />,
  info: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 22 }} />,
};

export function ConfirmModal({
  type = 'delete',
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  danger = type === 'delete',
  loading = false,
  open,
  onOpenChange,
}: ConfirmModalProps) {
  const defaultTitles: Record<ConfirmType, string> = {
    delete: '确认删除',
    warning: '确认操作',
    success: '确认完成',
    info: '确认信息',
  };

  const defaultContents: Record<ConfirmType, string> = {
    delete: '此操作不可逆，确定要删除吗？',
    warning: '确定要执行此操作吗？',
    success: '操作已完成',
    info: '请确认以下信息',
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {iconMap[type]}
          {title || defaultTitles[type]}
        </span>
      }
      onCancel={handleCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleCancel}>{cancelText}</Button>
          <Button
            type="primary"
            danger={danger}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
      closable={false}
      maskClosable={!loading}
    >
      <p>{content || defaultContents[type]}</p>
    </Modal>
  );
}
