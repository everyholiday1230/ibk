import React from 'react';
import { Layout, Avatar, Badge, Dropdown, Space, Tag, Tooltip } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined, RobotOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
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

  return (
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
          background: 'rgba(255,255,255,0.15)', 
          padding: '4px 12px', 
          borderRadius: 8 
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>IBK</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginLeft: 6 }}>기업은행</span>
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
        
        <Badge count={5} offset={[-5, 5]}>
          <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#fff' }} />
        </Badge>
        
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
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
  );
};

export default Header;
