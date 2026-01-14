/**
 * IBK 카드 고객 이탈 예측 시스템 - Main App
 * 모바일 반응형 레이아웃 적용
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, Grid } from 'antd';
import koKR from 'antd/locale/ko_KR';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import Analytics from './pages/Analytics';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';
import ABTest from './pages/ABTest';
import Reports from './pages/Reports';
import Retention from './pages/Retention';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

const { Content } = Layout;
const { useBreakpoint } = Grid;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const screens = useBreakpoint();
  
  // 모바일에서 자동 접힘
  useEffect(() => {
    if (screens.xs || screens.sm) {
      setCollapsed(true);
    }
  }, [screens]);

  // 반응형 사이드바 너비
  const sidebarWidth = collapsed ? 80 : 200;
  const isMobile = !screens.md;

  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <Layout
            style={{
              marginLeft: isMobile ? 0 : sidebarWidth,
              transition: 'margin-left 0.2s',
            }}
          >
            <Header />
            <Content
              style={{
                margin: isMobile ? '12px 8px 0' : '24px 16px 0',
                overflow: 'initial',
              }}
            >
              <div
                style={{
                  padding: isMobile ? 12 : 24,
                  background: '#fff',
                  minHeight: 360,
                  borderRadius: 8,
                }}
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/abtest" element={<ABTest />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/retention" element={<Retention />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
