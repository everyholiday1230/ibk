import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Tag,
  Button,
  Space,
  Table,
  Tabs,
  Progress,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  AlertOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import apiClient from '../services/api';
import type { EChartsOption } from 'echarts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [segmentData, setSegmentData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    // 실시간 업데이트 (30초마다)
    const interval = setInterval(() => {
      loadRealtimeMetrics();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, alertsData, segmentAnalysis] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getUrgentAlerts(),
        apiClient.getSegmentAnalysis(),
      ]);
      setStats(statsData);
      setAlerts(alertsData);
      setSegmentData(segmentAnalysis);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeMetrics = async () => {
    try {
      const data = await apiClient.getRealtimeMetrics();
      // 실시간 지표 업데이트
      console.log('Realtime metrics:', data);
    } catch (error) {
      console.error('Failed to load realtime metrics:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="대시보드 데이터를 불러오는 중..." />
      </div>
    );
  }

  if (!stats) {
    return <Alert message="데이터를 불러올 수 없습니다" type="error" />;
  }

  // 생애주기 분포 차트
  const lifecycleChartOption: EChartsOption = {
    title: { text: '생애주기 분포', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}명 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: '65%',
        data: [
          { value: stats.lifecycle_distribution['신규'] || 0, name: '신규 (0-3개월)' },
          { value: stats.lifecycle_distribution['성장'] || 0, name: '성장 (3-12개월)' },
          { value: stats.lifecycle_distribution['성숙'] || 0, name: '성숙 (12개월+)' },
          { value: stats.lifecycle_distribution['쇠퇴'] || 0, name: '쇠퇴' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  // 리스크 레벨 분포 차트
  const riskLevelChartOption: EChartsOption = {
    title: { text: '이탈 위험 등급 분포', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: ['긴급 (90+)', '높음 (70-89)', '중간 (50-69)'],
    },
    yAxis: { type: 'value', name: '고객 수' },
    series: [
      {
        data: [
          { value: stats.risk_levels.critical, itemStyle: { color: '#ff4d4f' } },
          { value: stats.risk_levels.high, itemStyle: { color: '#faad14' } },
          { value: stats.risk_levels.medium, itemStyle: { color: '#1890ff' } },
        ],
        type: 'bar',
        barWidth: '50%',
      },
    ],
  };

  // 트렌드 차트
  const trendChartOption: EChartsOption = {
    title: { text: '이탈률 & 이탈 방지 추이', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['이탈률 (%)', '이탈 방지 (명)'], bottom: 0 },
    xAxis: { type: 'category', data: stats.trend.labels },
    yAxis: [
      { type: 'value', name: '이탈률 (%)', position: 'left' },
      { type: 'value', name: '이탈 방지 (명)', position: 'right' },
    ],
    series: [
      {
        name: '이탈률 (%)',
        type: 'line',
        data: stats.trend.churn_rate,
        yAxisIndex: 0,
        itemStyle: { color: '#ff4d4f' },
        smooth: true,
      },
      {
        name: '이탈 방지 (명)',
        type: 'bar',
        data: stats.trend.prevented,
        yAxisIndex: 1,
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  // 세그먼트 분석 차트
  const segmentChartOption: EChartsOption = {
    title: { text: '세그먼트별 이탈률 비교', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['연령대별', '지역별', '직업별'], bottom: 0 },
    xAxis: { type: 'value', name: '이탈률 (%)' },
    yAxis: {
      type: 'category',
      data: ['20대', '30대', '40대', '50대', '60대+'],
    },
    series: [
      {
        name: '연령대별',
        type: 'bar',
        data: segmentData?.by_age.map((s: any) => s.churn_rate) || [],
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  // 긴급 알림 테이블 컬럼
  const alertColumns = [
    {
      title: '고객 ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
      width: 100,
    },
    {
      title: '고객명',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 80,
    },
    {
      title: '위험도',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 80,
      render: (score: number) => (
        <Tag color={score >= 90 ? 'red' : score >= 70 ? 'orange' : 'blue'}>
          {score}점
        </Tag>
      ),
    },
    {
      title: '등급',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'CRITICAL' ? 'red' : 'orange'}>{type}</Tag>
      ),
    },
    {
      title: '이탈 사유',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'LTV',
      dataIndex: 'ltv',
      key: 'ltv',
      width: 100,
    },
    {
      title: '권장 액션',
      dataIndex: 'recommended_action',
      key: 'recommended_action',
      ellipsis: true,
    },
    {
      title: '발생 시간',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (time: string) => new Date(time).toLocaleString('ko-KR'),
    },
    {
      title: '액션',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="primary" size="small">
            상담
          </Button>
          <Button size="small">상세</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        <RiseOutlined /> 실시간 대시보드
      </h1>

      {/* 주요 지표 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 고객 수"
              value={stats.summary.total_customers}
              prefix={<UserOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="이탈 위험 고객"
              value={stats.summary.at_risk_customers}
              valueStyle={{ color: '#cf1322' }}
              prefix={<AlertOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="현재 이탈률"
              value={stats.summary.churn_rate}
              precision={1}
              valueStyle={{ color: '#faad14' }}
              prefix={<ArrowDownOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="이달 이탈 방지"
              value={stats.summary.prevented_this_month}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
      </Row>

      {/* 긴급 알림 */}
      <Card
        title={
          <span>
            <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            긴급 알림 ({alerts.length})
          </span>
        }
        extra={
          <Button type="primary" danger>
            전체 보기
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={alerts}
          columns={alertColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* 차트 그리드 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <ReactECharts option={lifecycleChartOption} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={riskLevelChartOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <ReactECharts option={trendChartOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      {/* 세그먼트 분석 */}
      <Card
        title="세그먼트 분석"
        style={{ marginBottom: 24 }}
        extra={
          <Button type="link">상세 분석 →</Button>
        }
      >
        <Tabs
          items={[
            {
              key: 'age',
              label: '연령대별',
              children: (
                <Table
                  dataSource={segmentData?.by_age || []}
                  rowKey="age_group"
                  columns={[
                    { title: '연령대', dataIndex: 'age_group', key: 'age_group' },
                    {
                      title: '전체 고객',
                      dataIndex: 'total',
                      key: 'total',
                      render: (v: number) => v.toLocaleString(),
                    },
                    {
                      title: '이탈 위험',
                      dataIndex: 'at_risk',
                      key: 'at_risk',
                      render: (v: number) => v.toLocaleString(),
                    },
                    {
                      title: '이탈률',
                      dataIndex: 'churn_rate',
                      key: 'churn_rate',
                      render: (v: number) => (
                        <span>
                          <Progress
                            percent={v}
                            size="small"
                            format={(percent) => `${percent}%`}
                          />
                        </span>
                      ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              ),
            },
            {
              key: 'region',
              label: '지역별',
              children: (
                <Table
                  dataSource={segmentData?.by_region || []}
                  rowKey="region"
                  columns={[
                    { title: '지역', dataIndex: 'region', key: 'region' },
                    {
                      title: '전체 고객',
                      dataIndex: 'total',
                      key: 'total',
                      render: (v: number) => v.toLocaleString(),
                    },
                    {
                      title: '이탈 위험',
                      dataIndex: 'at_risk',
                      key: 'at_risk',
                      render: (v: number) => v.toLocaleString(),
                    },
                    {
                      title: '이탈률',
                      dataIndex: 'churn_rate',
                      key: 'churn_rate',
                      render: (v: number) => `${v}%`,
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              ),
            },
            {
              key: 'occupation',
              label: '직업별',
              children: (
                <Table
                  dataSource={segmentData?.by_occupation || []}
                  rowKey="occupation"
                  columns={[
                    { title: '직업', dataIndex: 'occupation', key: 'occupation' },
                    {
                      title: '전체 고객',
                      dataIndex: 'total',
                      key: 'total',
                      render: (v: number) => v.toLocaleString(),
                    },
                    {
                      title: '이탈 위험',
                      dataIndex: 'at_risk',
                      key: 'at_risk',
                      render: (v: number) => v.toLocaleString(),
                    },
                    {
                      title: '이탈률',
                      dataIndex: 'churn_rate',
                      key: 'churn_rate',
                      render: (v: number) => `${v}%`,
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 예상 비즈니스 임팩트 */}
      <Card title={<span><DollarOutlined /> 예상 비즈니스 임팩트</span>}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="연간 매출 손실 방지"
              value={stats.summary.revenue_protected}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="예상 ROI"
              value={1425}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="평균 조기 감지"
              value="3-6"
              suffix="개월"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
