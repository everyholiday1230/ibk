import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Tag, Progress, Timeline, Table, Tabs } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import type { ColumnsType } from 'antd/es/table';

interface TransactionRecord {
  key: string;
  date: string;
  category: string;
  merchant: string;
  amount: number;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // 샘플 고객 상세 데이터
  const customerInfo = {
    customer_id: id,
    name: '김**',
    age: 35,
    gender: '남',
    phone: '010-****-1234',
    email: 'kim****@example.com',
    region: '서울특별시 강남구',
    join_date: '2022-03-15',
    lifecycle: 'decline',
    churn_score: 82,
    last_txn_days: 32,
    monthly_avg_amount: 2500000,
    total_txn_count: 456,
    favorite_categories: ['외식', '마트/편의점', '온라인쇼핑']
  };

  // 거래 내역
  const transactions: TransactionRecord[] = [
    { key: '1', date: '2026-01-10', category: '외식', merchant: '스타벅스 강남점', amount: 12000 },
    { key: '2', date: '2026-01-08', category: '마트/편의점', merchant: 'GS25', amount: 8500 },
    { key: '3', date: '2026-01-05', category: '온라인쇼핑', merchant: '쿠팡', amount: 85000 },
    { key: '4', date: '2025-12-28', category: '외식', merchant: '롯데리아', amount: 15000 },
    { key: '5', date: '2025-12-25', category: '문화/여가', merchant: 'CGV', amount: 32000 },
  ];

  const transactionColumns: ColumnsType<TransactionRecord> = [
    {
      title: '일자',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '업종',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '가맹점',
      dataIndex: 'merchant',
      key: 'merchant',
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
  ];

  // SHAP Feature Importance
  const shapFeatures = [
    { feature: 'days_since_last_txn', value: 32, importance: 0.25, impact: 'negative' },
    { feature: 'decline_rate', value: -35, importance: 0.20, impact: 'negative' },
    { feature: 'category_diversity', value: 3, importance: 0.15, impact: 'positive' },
    { feature: 'competitor_signal', value: 0.8, importance: 0.12, impact: 'negative' },
    { feature: 'monthly_amount', value: 2500000, importance: 0.10, impact: 'positive' },
  ];

  useEffect(() => {
    // 1. 월별 이용 금액 추이
    const amountTrendChart = echarts.init(document.getElementById('amountTrendChart')!);
    const amountTrendOption = {
      title: {
        text: '월별 이용 금액 추이',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['7월', '8월', '9월', '10월', '11월', '12월', '1월']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}만원'
        }
      },
      series: [
        {
          name: '이용 금액',
          type: 'line',
          data: [320, 310, 295, 280, 260, 240, 220],
          smooth: true,
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ])
          },
          markLine: {
            data: [{ type: 'average', name: '평균' }],
            lineStyle: { color: '#fa8c16', type: 'dashed' }
          }
        }
      ]
    };
    amountTrendChart.setOption(amountTrendOption);

    // 2. 업종별 이용 분포
    const categoryChart = echarts.init(document.getElementById('categoryChart')!);
    const categoryOption = {
      title: {
        text: '업종별 이용 분포',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}% ({d}%)'
      },
      legend: {
        bottom: 10,
        left: 'center'
      },
      series: [
        {
          name: '업종',
          type: 'pie',
          radius: '60%',
          data: [
            { value: 35, name: '외식', itemStyle: { color: '#1890ff' } },
            { value: 25, name: '마트/편의점', itemStyle: { color: '#52c41a' } },
            { value: 20, name: '온라인쇼핑', itemStyle: { color: '#faad14' } },
            { value: 10, name: '문화/여가', itemStyle: { color: '#722ed1' } },
            { value: 10, name: '기타', itemStyle: { color: '#8c8c8c' } }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    categoryChart.setOption(categoryOption);

    // 3. SHAP 설명
    const shapChart = echarts.init(document.getElementById('shapChart')!);
    const shapOption = {
      title: {
        text: 'SHAP 이탈 요인 분석 (AI 설명)',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: shapFeatures.map(f => f.feature)
      },
      series: [
        {
          name: 'SHAP Value',
          type: 'bar',
          data: shapFeatures.map(f => ({
            value: f.importance,
            itemStyle: {
              color: f.impact === 'negative' ? '#f5222d' : '#52c41a'
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => {
              const feature = shapFeatures[params.dataIndex];
              return `${feature.impact === 'negative' ? '↑' : '↓'} ${(feature.importance * 100).toFixed(0)}%`;
            }
          }
        }
      ]
    };
    shapChart.setOption(shapOption);

    const handleResize = () => {
      amountTrendChart.resize();
      categoryChart.resize();
      shapChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      amountTrendChart.dispose();
      categoryChart.dispose();
      shapChart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const lifecycleConfig: Record<string, { color: string; label: string }> = {
    onboarding: { color: 'green', label: 'Onboarding' },
    growth: { color: 'blue', label: 'Growth' },
    maturity: { color: 'purple', label: 'Maturity' },
    decline: { color: 'orange', label: 'Decline' },
    at_risk: { color: 'red', label: 'At-Risk' }
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 고객 기본 정보 */}
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UserOutlined style={{ fontSize: 24 }} />
                <span>고객 정보 - {customerInfo.customer_id}</span>
              </div>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="이름">{customerInfo.name}</Descriptions.Item>
                  <Descriptions.Item label="나이">{customerInfo.age}세</Descriptions.Item>
                  <Descriptions.Item label="성별">{customerInfo.gender}</Descriptions.Item>
                  <Descriptions.Item label="연락처">
                    <PhoneOutlined /> {customerInfo.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="이메일">
                    <MailOutlined /> {customerInfo.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="주소">
                    <HomeOutlined /> {customerInfo.region}
                  </Descriptions.Item>
                  <Descriptions.Item label="가입일">{customerInfo.join_date}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Card title="이탈 위험 분석" style={{ height: '100%' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Progress
                      type="circle"
                      percent={customerInfo.churn_score}
                      width={150}
                      strokeColor={
                        customerInfo.churn_score >= 90 ? '#f5222d' :
                        customerInfo.churn_score >= 70 ? '#fa8c16' : '#52c41a'
                      }
                      format={(percent) => (
                        <div>
                          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{percent}</div>
                          <div style={{ fontSize: 14 }}>이탈 위험도</div>
                        </div>
                      )}
                    />
                  </div>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="생애주기">
                      <Tag color={lifecycleConfig[customerInfo.lifecycle]?.color}>
                        {lifecycleConfig[customerInfo.lifecycle]?.label}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="마지막 거래">
                      <span style={{ color: customerInfo.last_txn_days > 30 ? '#f5222d' : '#000' }}>
                        {customerInfo.last_txn_days}일 전
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="월 평균 이용액">
                      {(customerInfo.monthly_avg_amount / 10000).toFixed(0)}만원
                    </Descriptions.Item>
                    <Descriptions.Item label="총 거래 건수">
                      {customerInfo.total_txn_count}건
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 차트 영역 */}
        <Col span={12}>
          <Card>
            <div id="amountTrendChart" style={{ width: '100%', height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <div id="categoryChart" style={{ width: '100%', height: 300 }} />
          </Card>
        </Col>

        {/* SHAP 설명 */}
        <Col span={24}>
          <Card>
            <div id="shapChart" style={{ width: '100%', height: 350 }} />
            <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <h4>AI 해석 요약</h4>
              <ul style={{ marginBottom: 0 }}>
                <li><b>days_since_last_txn (32일)</b>: 마지막 거래 후 오래 지남 → 이탈 위험 ↑</li>
                <li><b>decline_rate (-35%)</b>: 최근 3개월 사용 금액 35% 감소 → 이탈 위험 ↑</li>
                <li><b>category_diversity (3개)</b>: 다양한 업종 사용 → 이탈 위험 ↓ (긍정 요인)</li>
                <li><b>competitor_signal (0.8)</b>: 경쟁사 전환 신호 감지 → 이탈 위험 ↑</li>
              </ul>
            </div>
          </Card>
        </Col>

        {/* 권장 액션 */}
        <Col span={12}>
          <Card title="권장 개입 액션">
            <Timeline>
              <Timeline.Item color="red">
                <b>즉시 실행</b>: VIP 전용 쿠폰 5만원 발송
              </Timeline.Item>
              <Timeline.Item color="orange">
                <b>1일 이내</b>: 개인화 푸시 알림 (선호 업종 혜택 안내)
              </Timeline.Item>
              <Timeline.Item color="blue">
                <b>3일 이내</b>: 상담 전화 (만족도 조사 + 불만 청취)
              </Timeline.Item>
              <Timeline.Item color="green">
                <b>1주일 이내</b>: Win-back 캠페인 참여 유도
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="최근 거래 내역">
            <Table
              columns={transactionColumns}
              dataSource={transactions}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerDetail;
