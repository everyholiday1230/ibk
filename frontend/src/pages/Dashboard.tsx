import React, { useEffect, useState } from 'react';
import { 
  Row, Col, Card, Statistic, Progress, Table, Tag, Space, Select, 
  DatePicker, Button, Badge, Tabs, Alert, Tooltip, Modal, Timeline,
  Segmented, Input, Checkbox
} from 'antd';
import {
  UserOutlined, RiseOutlined, FallOutlined, AlertOutlined,
  ArrowUpOutlined, ArrowDownOutlined, BellOutlined, FireOutlined,
  DollarOutlined, LineChartOutlined, ThunderboltOutlined,
  ExportOutlined, ReloadOutlined, FilterOutlined, DownloadOutlined
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface RiskCustomer {
  key: string;
  customer_id: string;
  name: string;
  churn_score: number;
  churn_reason: string[];
  lifecycle: string;
  last_txn_days: number;
  monthly_amount: number;
  decline_rate: number;
  recommended_action: string;
  expected_roi: number;
  priority: string;
}

interface Insight {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action: string;
  impact: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [showROICalculator, setShowROICalculator] = useState(false);

  // 통계 데이터 (시간대별 비교 포함)
  const stats = {
    current: {
      totalCustomers: 7071623,
      atRiskCount: 892350,
      churnRate: 12.9,
      preventionRate: 76.3,
      avgChurnScore: 42.5,
      monthlyCost: 2850 // 억원
    },
    previous: {
      totalCustomers: 7102000,
      atRiskCount: 870000,
      churnRate: 13.3,
      preventionRate: 73.1
    },
    target: {
      churnRate: 10.0,
      preventionRate: 85.0
    }
  };

  // 실시간 인사이트
  const insights: Insight[] = [
    {
      type: 'critical',
      title: '🚨 고가치 VIP 고객 37명 긴급 이탈 위험',
      description: '월 평균 500만원 이상 사용 고객 중 37명이 60일 이상 미사용',
      action: 'VIP 전담팀 즉시 개입 필요',
      impact: '예상 손실: 연 186억원'
    },
    {
      type: 'critical',
      title: '⚠️ 서울 강남구 20-30대 급격한 이탈 증가',
      description: '전월 대비 28% 증가, 경쟁사 프로모션 영향 추정',
      action: '타겟 캠페인 긴급 실행',
      impact: '3,200명 위험군'
    },
    {
      type: 'warning',
      title: '📉 외식 업종 이용 15% 감소',
      description: '배달앱 경쟁 심화, 외식 카테고리 혜택 부족',
      action: '외식 특화 혜택 강화',
      impact: '월 520억원 거래 감소'
    },
    {
      type: 'info',
      title: '✅ Win-back 캠페인 성공률 82%',
      description: '지난주 실행한 쿠폰 캠페인 반응률 우수',
      action: '유사 캠페인 확대 추천',
      impact: '12,400명 이탈 방지'
    }
  ];

  // 세그먼트별 이탈률
  const segmentData = [
    { segment: '20대', count: 850000, churn_rate: 15.2, change: +2.1, avg_amount: 1800000 },
    { segment: '30대', count: 1800000, churn_rate: 11.8, change: -0.5, avg_amount: 2500000 },
    { segment: '40대', count: 2400000, churn_rate: 10.5, change: -1.2, avg_amount: 3200000 },
    { segment: '50대+', count: 2021623, churn_rate: 13.6, change: +0.8, avg_amount: 2800000 },
  ];

  // 지역별 분석
  const regionData = [
    { region: '서울', count: 2800000, churn_rate: 12.1, high_risk: 85000, trend: 'up' },
    { region: '경기', count: 2100000, churn_rate: 13.2, high_risk: 68000, trend: 'up' },
    { region: '부산', count: 680000, churn_rate: 12.8, high_risk: 22000, trend: 'stable' },
    { region: '대구', count: 520000, churn_rate: 13.5, high_risk: 18000, trend: 'down' },
    { region: '기타', count: 971623, churn_rate: 13.8, high_risk: 35000, trend: 'stable' },
  ];

  // 이탈 사유 분석 (복수 선택 가능)
  const churnReasons = [
    { reason: '혜택 부족', count: 245000, percentage: 27.5, trend: '+5%' },
    { reason: '경쟁사 전환', count: 198000, percentage: 22.2, trend: '+12%' },
    { reason: '사용 빈도 감소', count: 156000, percentage: 17.5, trend: '+3%' },
    { reason: '수수료/금리 불만', count: 134000, percentage: 15.0, trend: '-2%' },
    { reason: '앱/서비스 불편', count: 89000, percentage: 10.0, trend: '+8%' },
    { reason: '기타', count: 70350, percentage: 7.8, trend: '0%' },
  ];

  // 위험 고객 목록 (더 상세한 정보)
  const riskCustomers: RiskCustomer[] = [
    {
      key: '1',
      customer_id: 'C0012345',
      name: '김**',
      churn_score: 94,
      churn_reason: ['혜택 부족', '경쟁사 전환'],
      lifecycle: 'at_risk',
      last_txn_days: 68,
      monthly_amount: 5200000,
      decline_rate: -45,
      recommended_action: 'VIP 상담 + 5만원 쿠폰',
      expected_roi: 4.2,
      priority: 'critical'
    },
    {
      key: '2',
      customer_id: 'C0023456',
      name: '이**',
      churn_score: 87,
      churn_reason: ['사용 빈도 감소'],
      lifecycle: 'decline',
      last_txn_days: 45,
      monthly_amount: 2800000,
      decline_rate: -32,
      recommended_action: '3만원 쿠폰 발송',
      expected_roi: 3.8,
      priority: 'high'
    },
    {
      key: '3',
      customer_id: 'C0034567',
      name: '박**',
      churn_score: 82,
      churn_reason: ['수수료 불만', '앱 불편'],
      lifecycle: 'decline',
      last_txn_days: 32,
      monthly_amount: 1900000,
      decline_rate: -28,
      recommended_action: '수수료 면제 + 앱 개선 안내',
      expected_roi: 3.2,
      priority: 'high'
    },
    {
      key: '4',
      customer_id: 'C0045678',
      name: '최**',
      churn_score: 78,
      churn_reason: ['혜택 부족'],
      lifecycle: 'at_risk',
      last_txn_days: 61,
      monthly_amount: 3500000,
      decline_rate: -38,
      recommended_action: '맞춤 혜택 제안',
      expected_roi: 4.0,
      priority: 'high'
    },
    {
      key: '5',
      customer_id: 'C0056789',
      name: '정**',
      churn_score: 73,
      churn_reason: ['경쟁사 전환'],
      lifecycle: 'decline',
      last_txn_days: 28,
      monthly_amount: 2200000,
      decline_rate: -25,
      recommended_action: '경쟁력 비교 안내',
      expected_roi: 2.9,
      priority: 'medium'
    }
  ];

  const columns: ColumnsType<RiskCustomer> = [
    {
      title: '우선순위',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const config: Record<string, { icon: any; color: string }> = {
          critical: { icon: <FireOutlined />, color: 'red' },
          high: { icon: <AlertOutlined />, color: 'orange' },
          medium: { icon: <BellOutlined />, color: 'blue' }
        };
        return (
          <Tooltip title={priority.toUpperCase()}>
            <Badge count={config[priority].icon} style={{ backgroundColor: config[priority].color }} />
          </Tooltip>
        );
      },
      sorter: (a, b) => {
        const priorityOrder: Record<string, number> = { critical: 3, high: 2, medium: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    },
    {
      title: '고객 ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
      width: 120,
      render: (text: string) => <a>{text}</a>
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 80,
    },
    {
      title: '이탈 위험도',
      dataIndex: 'churn_score',
      key: 'churn_score',
      width: 150,
      render: (score: number) => (
        <Space>
          <Progress
            type="circle"
            percent={score}
            width={50}
            strokeColor={score >= 90 ? '#f5222d' : score >= 70 ? '#fa8c16' : '#faad14'}
          />
          <span style={{ fontWeight: 600, fontSize: 16, color: score >= 90 ? '#f5222d' : '#000' }}>
            {score}점
          </span>
        </Space>
      ),
      sorter: (a, b) => b.churn_score - a.churn_score,
    },
    {
      title: '이탈 사유',
      dataIndex: 'churn_reason',
      key: 'churn_reason',
      width: 180,
      render: (reasons: string[]) => (
        <Space direction="vertical" size={2}>
          {reasons.map((reason, idx) => (
            <Tag key={idx} color="red">{reason}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '월 이용액',
      dataIndex: 'monthly_amount',
      key: 'monthly_amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ fontWeight: 600 }}>
          {(amount / 10000).toFixed(0)}만원
        </span>
      ),
      sorter: (a, b) => b.monthly_amount - a.monthly_amount,
    },
    {
      title: '감소율',
      dataIndex: 'decline_rate',
      key: 'decline_rate',
      width: 100,
      render: (rate: number) => (
        <span style={{ color: '#f5222d', fontWeight: 600 }}>
          {rate}%
        </span>
      ),
      sorter: (a, b) => a.decline_rate - b.decline_rate,
    },
    {
      title: '마지막 거래',
      dataIndex: 'last_txn_days',
      key: 'last_txn_days',
      width: 100,
      render: (days: number) => (
        <span style={{ color: days > 60 ? '#f5222d' : '#000' }}>
          {days}일 전
        </span>
      ),
      sorter: (a, b) => b.last_txn_days - a.last_txn_days,
    },
    {
      title: '예상 ROI',
      dataIndex: 'expected_roi',
      key: 'expected_roi',
      width: 100,
      render: (roi: number) => (
        <Tooltip title="캠페인 비용 대비 예상 수익">
          <Tag color="green">{roi}배</Tag>
        </Tooltip>
      ),
      sorter: (a, b) => b.expected_roi - a.expected_roi,
    },
    {
      title: '권장 액션',
      dataIndex: 'recommended_action',
      key: 'recommended_action',
      width: 200,
      render: (action: string, record) => (
        <Space direction="vertical" size={4}>
          <Tag color="blue">{action}</Tag>
          <Button type="link" size="small" onClick={() => handleQuickAction(record)}>
            즉시 실행 →
          </Button>
        </Space>
      ),
    },
  ];

  const handleQuickAction = (customer: RiskCustomer) => {
    Modal.confirm({
      title: `${customer.name} 고객 캠페인 실행`,
      content: (
        <div>
          <p><b>고객 ID:</b> {customer.customer_id}</p>
          <p><b>이탈 위험도:</b> {customer.churn_score}점</p>
          <p><b>권장 액션:</b> {customer.recommended_action}</p>
          <p><b>예상 ROI:</b> {customer.expected_roi}배</p>
          <Alert 
            message="즉시 실행하시겠습니까?" 
            description="SMS, 앱 푸시, 쿠폰이 자동으로 발송됩니다." 
            type="info" 
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      okText: '실행',
      cancelText: '취소',
      onOk: () => {
        // 실제 API 호출
        console.log('Campaign executed for', customer.customer_id);
      }
    });
  };

  // ECharts 초기화
  useEffect(() => {
    // 1. 이탈 추이 그래프 (비교 포함)
    const churnTrendChart = echarts.init(document.getElementById('churnTrendChart')!);
    const churnTrendOption = {
      title: {
        text: '월별 이탈률 추이 (전년 동기 대비)',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['2026년', '2025년', '목표'],
        bottom: 10
      },
      xAxis: {
        type: 'category',
        data: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '2026년',
          type: 'line',
          data: [13.5, 13.2, 13.0, 12.8, 12.9, 12.7, 12.5, 12.4, 12.6, 12.8, 12.9, 12.9],
          smooth: true,
          itemStyle: { color: '#f5222d' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 34, 45, 0.3)' },
              { offset: 1, color: 'rgba(245, 34, 45, 0.05)' }
            ])
          }
        },
        {
          name: '2025년',
          type: 'line',
          data: [14.2, 14.0, 13.8, 13.9, 14.1, 13.7, 13.9, 14.0, 13.8, 14.2, 14.3, 13.3],
          smooth: true,
          itemStyle: { color: '#999' },
          lineStyle: { type: 'dashed' }
        },
        {
          name: '목표',
          type: 'line',
          data: Array(12).fill(10.0),
          itemStyle: { color: '#52c41a' },
          lineStyle: { type: 'dashed', width: 2 }
        }
      ]
    };
    churnTrendChart.setOption(churnTrendOption);

    // 2. 이탈 사유 분석
    const reasonChart = echarts.init(document.getElementById('reasonChart')!);
    const reasonOption = {
      title: {
        text: '이탈 사유 분석 (복수 응답)',
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
        axisLabel: {
          formatter: '{value}명'
        }
      },
      yAxis: {
        type: 'category',
        data: churnReasons.map(r => r.reason)
      },
      series: [
        {
          name: '이탈 고객 수',
          type: 'bar',
          data: churnReasons.map(r => ({
            value: r.count,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#f5222d' },
                { offset: 1, color: '#fa8c16' }
              ])
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => {
              const item = churnReasons[params.dataIndex];
              return `${item.percentage}% (${item.trend})`;
            }
          }
        }
      ]
    };
    reasonChart.setOption(reasonOption);

    // 3. 세그먼트별 분석
    const segmentChart = echarts.init(document.getElementById('segmentChart')!);
    const segmentOption = {
      title: {
        text: '연령대별 이탈률 & 거래액',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['이탈률', '평균 거래액'],
        bottom: 10
      },
      xAxis: {
        type: 'category',
        data: segmentData.map(s => s.segment)
      },
      yAxis: [
        {
          type: 'value',
          name: '이탈률 (%)',
          position: 'left',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        {
          type: 'value',
          name: '평균 거래액 (만원)',
          position: 'right',
          axisLabel: {
            formatter: '{value}만'
          }
        }
      ],
      series: [
        {
          name: '이탈률',
          type: 'bar',
          data: segmentData.map(s => s.churn_rate),
          itemStyle: { color: '#fa8c16' }
        },
        {
          name: '평균 거래액',
          type: 'line',
          yAxisIndex: 1,
          data: segmentData.map(s => s.avg_amount / 10000),
          itemStyle: { color: '#1890ff' },
          smooth: true
        }
      ]
    };
    segmentChart.setOption(segmentOption);

    // 4. 지역별 히트맵
    const regionChart = echarts.init(document.getElementById('regionChart')!);
    const regionOption = {
      title: {
        text: '지역별 위험 고객 분포',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const item = regionData[params.dataIndex];
          return `${item.region}<br/>
                  위험 고객: ${(item.high_risk / 1000).toFixed(1)}천명<br/>
                  이탈률: ${item.churn_rate}%<br/>
                  추세: ${item.trend}`;
        }
      },
      series: [
        {
          name: '지역별 분포',
          type: 'treemap',
          data: regionData.map(r => ({
            name: `${r.region}\n${(r.high_risk / 1000).toFixed(1)}천명`,
            value: r.high_risk,
            itemStyle: {
              color: r.churn_rate > 13 ? '#f5222d' : r.churn_rate > 12 ? '#fa8c16' : '#52c41a'
            }
          }))
        }
      ]
    };
    regionChart.setOption(regionOption);

    // 반응형 처리
    const handleResize = () => {
      churnTrendChart.resize();
      reasonChart.resize();
      segmentChart.resize();
      regionChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      churnTrendChart.dispose();
      reasonChart.dispose();
      segmentChart.dispose();
      regionChart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* 실시간 알림 */}
      <Alert
        message={<><BellOutlined /> 실시간 알림: 지난 1시간 동안 고위험 고객 127명 증가</>}
        type="warning"
        showIcon
        closable
        style={{ marginBottom: 16 }}
        action={
          <Button size="small" type="primary">
            즉시 확인
          </Button>
        }
      />

      {/* 필터 및 제어 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Space>
              <span>기간:</span>
              <Segmented
                options={[
                  { label: '오늘', value: 'today' },
                  { label: '주간', value: 'week' },
                  { label: '월간', value: 'month' },
                  { label: '분기', value: 'quarter' }
                ]}
                value={timeRange}
                onChange={(value) => setTimeRange(value as any)}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Select
              defaultValue="all"
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: '전체 고객' },
                { value: 'personal', label: '개인 고객' },
                { value: 'corporate', label: '기업 고객' },
                { value: 'vip', label: 'VIP 고객' },
              ]}
              onChange={setSelectedSegment}
            />
          </Col>
          <Col span={6}>
            <RangePicker 
              style={{ width: '100%' }}
              defaultValue={[dayjs().subtract(30, 'day'), dayjs()]}
            />
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />}>새로고침</Button>
              <Button icon={<FilterOutlined />}>고급 필터</Button>
              <Button icon={<DownloadOutlined />} type="primary">리포트 다운로드</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 핵심 지표 카드 (비교 포함) */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 회원 수"
              value={stats.current.totalCustomers}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              suffix="명"
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#f5222d' }}>
                <ArrowDownOutlined /> 전월 대비 -30,377명 (-0.4%)
              </span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="이탈 위험 고객"
              value={stats.current.atRiskCount}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<AlertOutlined />}
              suffix="명"
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#f5222d' }}>
                <ArrowUpOutlined /> 전월 대비 +22,350명 (+2.6%)
              </span>
            </div>
            <Progress 
              percent={12.6} 
              strokeColor="#f5222d" 
              size="small" 
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="현재 이탈률"
              value={stats.current.churnRate}
              precision={1}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FallOutlined />}
              suffix="%"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
              <ArrowDownOutlined /> 전월 대비 -0.4%p
              <br />
              <span style={{ color: '#999' }}>목표: {stats.target.churnRate}%</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="이탈 방지율"
              value={stats.current.preventionRate}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
              suffix="%"
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#52c41a' }}>
                <ArrowUpOutlined /> 전월 대비 +3.2%p
              </span>
              <br />
              <span style={{ color: '#999' }}>목표: {stats.target.preventionRate}%</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 추가 지표 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="월 예상 손실액"
              value={stats.current.monthlyCost}
              precision={0}
              valueStyle={{ color: '#f5222d', fontSize: 24 }}
              prefix={<DollarOutlined />}
              suffix="억원"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              AI 개입으로 절감 가능
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="평균 이탈 위험도"
              value={stats.current.avgChurnScore}
              precision={1}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<LineChartOutlined />}
              suffix="점"
            />
            <Progress 
              percent={stats.current.avgChurnScore} 
              strokeColor="#fa8c16" 
              size="small" 
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="긴급 대응 필요"
              value={127}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ThunderboltOutlined />}
              suffix="명"
            />
            <div style={{ marginTop: 8 }}>
              <Button type="primary" danger size="small" block>
                즉시 조치
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="이번 주 실행 캠페인"
              value={12}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BellOutlined />}
              suffix="건"
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#52c41a' }}>평균 반응률: 34.2%</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 실시간 인사이트 */}
      <Card 
        title={<><FireOutlined /> 실시간 인사이트 & 액션 추천</>}
        style={{ marginBottom: 24 }}
        extra={<Button type="link">모두 보기 →</Button>}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {insights.map((insight, idx) => (
            <Alert
              key={idx}
              message={insight.title}
              description={
                <div>
                  <p>{insight.description}</p>
                  <p><b>권장 액션:</b> {insight.action}</p>
                  <p><b>예상 임팩트:</b> {insight.impact}</p>
                </div>
              }
              type={insight.type}
              showIcon
              action={
                <Button size="small" type="primary">
                  실행
                </Button>
              }
            />
          ))}
        </Space>
      </Card>

      {/* 차트 영역 - Tabs로 구성 */}
      <Card style={{ marginBottom: 24 }}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="이탈 추이" key="1">
            <div id="churnTrendChart" style={{ width: '100%', height: 400 }} />
          </TabPane>
          <TabPane tab="이탈 사유 분석" key="2">
            <div id="reasonChart" style={{ width: '100%', height: 400 }} />
          </TabPane>
          <TabPane tab="세그먼트 분석" key="3">
            <div id="segmentChart" style={{ width: '100%', height: 400 }} />
          </TabPane>
          <TabPane tab="지역별 히트맵" key="4">
            <div id="regionChart" style={{ width: '100%', height: 400 }} />
          </TabPane>
        </Tabs>
      </Card>

      {/* 위험 고객 목록 (고급 기능) */}
      <Card 
        title={
          <Space>
            <AlertOutlined style={{ color: '#f5222d' }} />
            <span>긴급 대응 필요 고객 (이탈 위험도 70점 이상)</span>
            <Badge count={riskCustomers.length} style={{ backgroundColor: '#f5222d' }} />
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>일괄 캠페인 실행</Button>
            <Button icon={<DownloadOutlined />}>엑셀 다운로드</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={riskCustomers}
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `전체 ${total}명 (예상 방지 가능: ${Math.floor(total * 0.763)}명)`
          }}
          scroll={{ x: 1600 }}
          summary={(pageData) => {
            const totalAmount = pageData.reduce((sum, record) => sum + record.monthly_amount, 0);
            const avgROI = (pageData.reduce((sum, record) => sum + record.expected_roi, 0) / pageData.length).toFixed(1);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <b>현재 페이지 합계</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <b>{(totalAmount / 10000).toFixed(0)}만원</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} colSpan={2}>
                    <span style={{ color: '#999' }}>평균 ROI: {avgROI}배</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} colSpan={3}>
                    <Button type="primary" size="small">
                      선택 고객 일괄 실행
                    </Button>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* ROI 계산기 모달 */}
      <Modal
        title="🧮 ROI 계산기"
        open={showROICalculator}
        onCancel={() => setShowROICalculator(false)}
        footer={null}
        width={600}
      >
        {/* ROI 계산기 내용 */}
      </Modal>
    </div>
  );
};

export default Dashboard;
