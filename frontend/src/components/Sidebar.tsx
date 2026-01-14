/**
 * 사이드바 컴포넌트
 * - 텍스트 기반 네비게이션 메뉴
 * - IBK 로고 클릭 시 홈으로 이동
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React from 'react';
import { Layout } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

// 사이드바 고정 너비
const SIDEBAR_WIDTH = 180;

// 메뉴 아이템 정의
const menuItems = [
  { key: '/dashboard', label: '대시보드' },
  { key: '/customers', label: '고객 관리' },
  { key: '/analytics', label: '이탈 분석' },
  { key: '/campaigns', label: '캠페인' },
  { key: '/reports', label: '보고서' },
  { key: '/settings', label: '설정' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 로고 클릭 시 홈(대시보드)으로 이동
  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  // 메뉴 클릭 핸들러
  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <Sider 
      width={SIDEBAR_WIDTH}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#001529'
      }}
    >
      {/* 로고 영역 - 클릭 가능 */}
      <div 
        onClick={handleLogoClick}
        style={{ 
          height: 64, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ 
          fontSize: 22,
          fontWeight: 'bold',
          color: '#fff',
          letterSpacing: 2
        }}>
          IBK
        </div>
        <div style={{ 
          fontSize: 10, 
          color: 'rgba(255,255,255,0.65)',
          marginTop: 2
        }}>
          카드고객 이탈방지
        </div>
      </div>
      
      {/* 메뉴 영역 - 텍스트 기반 */}
      <div style={{ padding: '16px 0' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.key;
          return (
            <div
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              style={{
                padding: '12px 24px',
                cursor: 'pointer',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive ? '#1890ff' : 'transparent',
                fontSize: 14,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                }
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
      
      {/* 하단 브랜드 영역 */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ 
          color: '#ffc53d', 
          fontSize: 11, 
          fontWeight: 600,
          marginBottom: 4
        }}>
          범온누리 AI
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>
          (주)범온누리 이노베이션
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
