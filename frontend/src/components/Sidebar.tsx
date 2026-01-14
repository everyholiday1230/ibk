import React from 'react';
import { Layout, Menu, Tooltip } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  BankOutlined,
  RobotOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '대시보드',
  },
  {
    key: '/customers',
    icon: <UserOutlined />,
    label: '고객 관리',
  },
  {
    key: '/analytics',
    icon: <BarChartOutlined />,
    label: '이탈 분석',
  },
  {
    key: '/campaigns',
    icon: <BellOutlined />,
    label: '캠페인',
  },
  {
    key: '/retention',
    icon: <SafetyOutlined />,
    label: '효과 추적',
  },
  {
    key: '/abtest',
    icon: <ExperimentOutlined />,
    label: 'A/B 테스트',
  },
  {
    key: '/reports',
    icon: <FileTextOutlined />,
    label: '보고서',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '설정',
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={setCollapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, #001529 0%, #002140 100%)'
      }}
    >
      {/* 로고 영역 */}
      <div style={{ 
        height: 64, 
        margin: 16, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#fff',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          fontSize: collapsed ? 20 : 24,
          fontWeight: 'bold'
        }}>
          <BankOutlined style={{ color: '#1890ff' }} />
          {!collapsed && <span>IBK</span>}
        </div>
        {!collapsed && (
          <div style={{ 
            fontSize: 10, 
            color: 'rgba(255,255,255,0.65)',
            marginTop: 2
          }}>
            카드고객 이탈방지
          </div>
        )}
      </div>
      
      <Menu
        theme="dark"
        selectedKeys={[location.pathname]}
        mode="inline"
        items={items}
        onClick={handleMenuClick}
        style={{ background: 'transparent' }}
      />
      
      {/* 하단 범온누리 브랜드 영역 */}
      <div style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        {collapsed ? (
          <Tooltip title="Powered by 범온누리 AI">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              color: '#ffc53d'
            }}>
              <RobotOutlined style={{ fontSize: 18 }} />
            </div>
          </Tooltip>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 6,
              marginBottom: 4
            }}>
              <RobotOutlined style={{ color: '#ffc53d', fontSize: 14 }} />
              <span style={{ color: '#ffc53d', fontSize: 12, fontWeight: 600 }}>
                범온누리 AI
              </span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>
              Powered by 범온누리 이노베이션
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              XGBoost + LightGBM + RF Ensemble
            </div>
          </div>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;
