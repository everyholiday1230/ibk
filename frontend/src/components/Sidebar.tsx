import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  BankOutlined
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
      }}
    >
      <div style={{ 
        height: 64, 
        margin: 16, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#fff',
        fontSize: collapsed ? 20 : 24,
        fontWeight: 'bold'
      }}>
        {collapsed ? <BankOutlined /> : 'IBK AI'}
      </div>
      <Menu
        theme="dark"
        selectedKeys={[location.pathname]}
        mode="inline"
        items={items}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;
