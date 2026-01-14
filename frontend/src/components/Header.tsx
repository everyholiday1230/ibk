/**
 * 헤더 컴포넌트
 * - IBK 로고 및 시스템명
 * - 알림 표시 (실시간)
 * - 사용자 메뉴
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Avatar, Badge, Dropdown, Space, Tag, Tooltip, Modal, List, Button, message } from 'antd';
import { 
  BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined, 
  RobotOutlined, WarningOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, CloseOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import apiClient from '../services/api';

const { Header: AntHeader } = Layout;

interface Alert {
  id: number;
  customer_id: string;
  customer_name: string;
  risk_score: number;
  alert_type: string;
  reason: string;
  ltv: string;
  recommended_action: string;
  timestamp: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 알림 로드
  useEffect(() => {
    loadAlerts();
    // 30초마다 알림 갱신
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await apiClient.getUrgentAlerts();
      setAlerts(data || []);
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    }
  };

  // 알림 클릭 핸들러
  const handleAlertClick = () => {
    setAlertModalVisible(true);
  };

  // 고객 상세 페이지로 이동
  const handleViewCustomer = (customerId: string) => {
    setAlertModalVisible(false);
    navigate(`/customers/${customerId}`);
  };

  // 전체 알림 보기
  const handleViewAllAlerts = () => {
    setAlertModalVisible(false);
    navigate('/customers?risk_level=CRITICAL');
  };

  // 사용자 메뉴 핸들러
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'profile':
        message.info('프로필 페이지는 준비 중입니다.');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        message.success('로그아웃되었습니다.');
        break;
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '내 프로필',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
    },
  ];

  // 알림 아이콘 색상
  const getAlertTypeIcon = (alertType: string) => {
    if (alertType === 'CRITICAL') {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    return <WarningOutlined style={{ color: '#faad14' }} />;
  };

  return (
    <>
      <AntHeader 
        style={{ 
          padding: '0 24px', 
          background: 'linear-gradient(135deg, #002766 0%, #003a8c 50%, #0050b3 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* IBK 로고 영역 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.95)', 
            padding: '6px 14px', 
            borderRadius: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <img 
              src="https://sspark.genspark.ai/cfimages?u1=aCDjaf3SI9v0XZSC5HDUJS51tJEzUxUsl3xHNzYG1EbOWjTAGnYvQB92c4ELf0n8j4R95TBZT%2FKn5oky%2BAMG1A84RMVEbrc3hN9kJzhJ6LAUuYQ%3D&u2=iyrNXSyAQZmuJ8Ut&width=2560" 
              alt="IBK 기업은행 로고" 
              style={{ 
                height: 32, 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          </div>
          
          {/* 시스템명 */}
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>
            카드고객 이탈방지 AI 시스템
          </div>
          
          {/* Powered by 범온누리 */}
          <Tooltip title="범온누리 이노베이션 AI 솔루션">
            <Tag 
              icon={<RobotOutlined />} 
              color="gold" 
              style={{ 
                margin: 0, 
                fontSize: 11,
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span style={{ fontWeight: 600 }}>범온누리 AI</span>
            </Tag>
          </Tooltip>
        </div>
        
        <Space size={20}>
          {/* 실시간 상태 표시 */}
          <Tooltip title="AI 모델 정상 작동 중">
            <Tag color="green" style={{ margin: 0 }}>
              <span style={{ fontSize: 10 }}>● AI 모델 정상</span>
            </Tag>
          </Tooltip>
          
          {/* 알림 벨 아이콘 - 클릭 가능 */}
          <Tooltip title={`${unreadCount}개의 긴급 알림`}>
            <div 
              style={{ 
                position: 'relative', 
                display: 'inline-flex', 
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px'
              }}
              onClick={handleAlertClick}
              onMouseEnter={(e) => {
                const bell = e.currentTarget.querySelector('.bell-icon') as HTMLElement;
                if (bell) bell.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                const bell = e.currentTarget.querySelector('.bell-icon') as HTMLElement;
                if (bell) bell.style.transform = 'scale(1)';
              }}
            >
              <BellOutlined 
                className="bell-icon"
                style={{ 
                  fontSize: 22, 
                  color: '#fff',
                  transition: 'transform 0.2s'
                }} 
              />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    backgroundColor: '#ff4d4f',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 'bold',
                    minWidth: 16,
                    height: 16,
                    lineHeight: '16px',
                    borderRadius: 8,
                    textAlign: 'center',
                    padding: '0 4px',
                    boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </Tooltip>
          
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', color: '#fff' }}>
              <Avatar 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
              />
              <span style={{ color: '#fff' }}>관리자</span>
            </Space>
          </Dropdown>
        </Space>
      </AntHeader>

      {/* 알림 모달 */}
      <Modal
        title={
          <Space>
            <BellOutlined style={{ color: '#ff4d4f' }} />
            <span>긴급 알림 ({alerts.length}건)</span>
          </Space>
        }
        open={alertModalVisible}
        onCancel={() => setAlertModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAlertModalVisible(false)}>
            닫기
          </Button>,
          <Button key="viewAll" type="primary" onClick={handleViewAllAlerts}>
            전체 고위험 고객 보기
          </Button>,
        ]}
        width={700}
      >
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <p style={{ marginTop: 16, color: '#666' }}>현재 긴급 알림이 없습니다.</p>
          </div>
        ) : (
          <List
            dataSource={alerts}
            renderItem={(alert) => (
              <List.Item
                key={alert.id}
                actions={[
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => handleViewCustomer(alert.customer_id)}
                  >
                    상세 보기
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={getAlertTypeIcon(alert.alert_type)}
                  title={
                    <Space>
                      <Tag color={alert.alert_type === 'CRITICAL' ? 'red' : 'orange'}>
                        {alert.alert_type}
                      </Tag>
                      <span>{alert.customer_name}</span>
                      <span style={{ color: '#999', fontSize: 12 }}>({alert.customer_id})</span>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <strong>사유:</strong> {alert.reason}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <strong>위험도:</strong> {alert.risk_score}점 | 
                        <strong> LTV:</strong> {alert.ltv}
                      </div>
                      <div style={{ color: '#1890ff' }}>
                        <strong>권장 조치:</strong> {alert.recommended_action}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
};

export default Header;
