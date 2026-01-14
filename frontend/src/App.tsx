/**
 * IBK 카드 고객 이탈 예측 시스템 - Main App
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import koKR from 'antd/locale/ko_KR';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import Analytics from './pages/Analytics';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

const { Content } = Layout;

// 사이드바 고정 너비
const SIDEBAR_WIDTH = 180;

const App: React.FC = () => {
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
          <Sidebar />
          <Layout style={{ marginLeft: SIDEBAR_WIDTH }}>
            <Header />
            <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
              <div style={{ padding: 24, background: '#fff', minHeight: 360, borderRadius: 8 }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/reports" element={<Reports />} />
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
