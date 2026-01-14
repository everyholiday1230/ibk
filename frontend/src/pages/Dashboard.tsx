import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Space, Select, DatePicker } from 'antd';
import {
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface RiskCustomer {
  key: string;
  customer_id: string;
  name: string;
  churn_score: number;
  lifecycle: string;
  last_txn_days: number;
  recommended_action: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // 통계 데이터
  const stats = {
    totalCustomers: 7071623,
    atRiskCount: 892350,
    churnRate: 12.9,
    preventionRate: 76.3
  };

  // 생애주기 분포
  const lifecycleDistribution = [
    { stage: 'Onboarding', count: 850000, percentage: 12.0, color: '#52c41a' },
    { stage: 'Growth', count: 1200000, percentage: 17.0, color: '#1890ff' },
    { stage: 'Maturity', count: 3800000, percentage: 53.7, color: '#722ed1' },
    { stage: 'Decline', count: 850000, percentage: 12.0, color: '#fa8c16' },
    { stage: 'At-Risk', count: 371623, percentage: 5.3, color: '#f5222d' }
  ];

  // 위험 고객 목록
  const riskCustomers: RiskCustomer[] = [
    {
      key: '1',
      customer_id: 'C0012345',
      name: '김**',
      churn_score: 94,
      lifecycle: 'at_risk',
      last_txn_days: 68,
      recommended_action: 'VIP 상담 + 특별 혜택'
    },
    {
      key: '2',
      customer_id: 'C0023456',
      name: '이**',
      churn_score: 87,
      lifecycle: 'decline',
      last_txn_days: 45,
      recommended_action: '쿠폰 발송'
    },
    {
      key: '3',
      customer_id: 'C0034567',
      name: '박**',
      churn_score: 82,
      lifecycle: 'decline',
      last_txn_days: 32,
      recommended_action: '캠페인 참여 유도'
    },
    {
      key: '4',
      customer_id: 'C0045678',
      name: '최**',
      churn_score: 78,
      lifecycle: 'at_risk',
      last_txn_days: 61,
      recommended_action: '맞춤 푸시 알림'
    },
    {
      key: '5',
      customer_id: 'C0056789',
      name: '정**',
      churn_score: 73,
      lifecycle: 'decline',
      last_txn_days: 28,
      recommended_action: '혜택 안내'
    }
  ];

  const columns: ColumnsType<RiskCustomer> = [
    {
      title: '고객 ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '이탈 위험도',
      dataIndex: 'churn_score',
      key: 'churn_score',
      render: (score: number) => (
        <Space>
          <Progress
            type="circle"
            percent={score}
            width={50}
            strokeColor={score >= 90 ? '#f5222d' : score >= 70 ? '#fa8c16' : '#faad14'}
          />
          <span style={{ fontWeight: 600, color: score >= 90 ? '#f5222d' : '#000' }}>
            {score}점
          </span>
        </Space>
      ),
      sorter: (a, b) => b.churn_score - a.churn_score,
    },
    {
      title: '생애주기',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      render: (lifecycle: string) => {
        const config: Record<string, { color: string; label: string }> = {
          at_risk: { color: 'red', label: 'At-Risk' },
          decline: { color: 'orange', label: 'Decline' },
          maturity: { color: 'blue', label: 'Maturity' },
        };
        return <Tag color={config[lifecycle]?.color}>{config[lifecycle]?.label}</Tag>;
      },
    },
    {
      title: '마지막 거래',
      dataIndex: 'last_txn_days',
      key: 'last_txn_days',
      render: (days: number) => `${days}일 전`,
      sorter: (a, b) => b.last_txn_days - a.last_txn_days,
    },
    {
      title: '권장 액션',
      dataIndex: 'recommended_action',
      key: 'recommended_action',
      render: (action: string) => (
        <Tag color="blue">{action}</Tag>
      ),
    },
  ];

  // ECharts 초기화
  useEffect(() => {
    // 1. 이탈 추이 그래프
    const churnTrendChart = echarts.init(document.getElementById('churnTrendChart')!);
    const churnTrendOption = {
      title: {
        text: '월별 이탈률 추이',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
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
          name: '이탈률',
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
        }
      ]
    };
    churnTrendChart.setOption(churnTrendOption);

    // 2. 생애주기 분포 차트
    const lifecycleChart = echarts.init(document.getElementById('lifecycleChart')!);
    const lifecycleOption = {
      title: {
        text: '고객 생애주기 분포',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}명 ({d}%)'
      },
      legend: {
        bottom: 10,
        left: 'center'
      },
      series: [
        {
          name: '생애주기',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: lifecycleDistribution.map(item => ({
            value: item.count,
            name: item.stage,
            itemStyle: { color: item.color }
          }))
        }
      ]
    };
    lifecycleChart.setOption(lifecycleOption);

    // 3. Feature 중요도 차트
    const featureChart = echarts.init(document.getElementById('featureChart')!);
    const featureOption = {
      title: {
        text: 'Top 10 이탈 예측 주요 Feature',
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
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: [
          'Recency',
          'Frequency Decline',
          'Monetary Drop',
          'Days Since Last Txn',
          'Category Diversity',
          'Competitor Signal',
          'Decline Rate',
          'Usage Consistency',
          'Main Card Prob',
          'Loyalty Score'
        ]
      },
      series: [
        {
          name: 'SHAP Importance',
          type: 'bar',
          data: [0.25, 0.20, 0.15, 0.12, 0.10, 0.08, 0.05, 0.03, 0.01, 0.01],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#52c41a' }
            ])
          }
        }
      ]
    };
    featureChart.setOption(featureOption);

    // 반응형 처리
    const handleResize = () => {
      churnTrendChart.resize();
      lifecycleChart.resize();
      featureChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      churnTrendChart.dispose();
      lifecycleChart.dispose();
      featureChart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* 필터 영역 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Select
            defaultValue="all"
            style={{ width: '100%' }}
            options={[
              { value: 'all', label: '전체 고객' },
              { value: 'personal', label: '개인 고객' },
              { value: 'corporate', label: '기업 고객' }
            ]}
          />
        </Col>
        <Col span={8}>
          <Select
            defaultValue="all_lifecycle"
            style={{ width: '100%' }}
            options={[
              { value: 'all_lifecycle', label: '전체 생애주기' },
              { value: 'onboarding', label: 'Onboarding' },
              { value: 'growth', label: 'Growth' },
              { value: 'maturity', label: 'Maturity' },
              { value: 'decline', label: 'Decline' },
              { value: 'at_risk', label: 'At-Risk' }
            ]}
          />
        </Col>
        <Col span={8}>
          <RangePicker 
            style={{ width: '100%' }}
            defaultValue={[dayjs().subtract(30, 'day'), dayjs()]}
          />
        </Col>
      </Row>

      {/* 핵심 지표 카드 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 회원 수"
              value={stats.totalCustomers}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="이탈 위험 고객"
              value={stats.atRiskCount}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<AlertOutlined />}
              suffix="명"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              <ArrowUpOutlined style={{ color: '#f5222d' }} /> 전월 대비 +2.3%
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="현재 이탈률"
              value={stats.churnRate}
              precision={1}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FallOutlined />}
              suffix="%"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              <ArrowDownOutlined style={{ color: '#52c41a' }} /> 전월 대비 -0.4%p
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="이탈 방지율"
              value={stats.preventionRate}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
              suffix="%"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> 전월 대비 +3.2%p
            </div>
          </Card>
        </Col>
      </Row>

      {/* 차트 영역 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <div id="churnTrendChart" style={{ width: '100%', height: 350 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <div id="lifecycleChart" style={{ width: '100%', height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <div id="featureChart" style={{ width: '100%', height: 350 }} />
          </Card>
        </Col>
      </Row>

      {/* 위험 고객 목록 */}
      <Card 
        title={
          <Space>
            <AlertOutlined style={{ color: '#f5222d' }} />
            <span>긴급 대응 필요 고객 (이탈 위험도 70점 이상)</span>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={riskCustomers}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
