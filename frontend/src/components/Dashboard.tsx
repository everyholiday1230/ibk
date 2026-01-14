import React from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, AlertOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

interface DashboardProps {
  data?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // 임시 데이터
  const stats = {
    totalCustomers: 7070000,
    churnRate: 3.2,
    atRiskCustomers: 85000,
    preventedRevenue: 1200000000
  };

  // 이탈률 트렌드 차트
  const trendChartOption = {
    title: { text: '월별 이탈률 추이' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1월', '2월', '3월', '4월', '5월', '6월']
    },
    yAxis: { type: 'value', name: '이탈률 (%)' },
    series: [{
      data: [3.5, 3.4, 3.3, 3.2, 3.1, 3.0],
      type: 'line',
      smooth: true,
      itemStyle: { color: '#1890ff' }
    }]
  };

  // 위험 등급 분포 차트
  const riskDistributionOption = {
    title: { text: '고객 위험 등급 분포' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { value: 5900000, name: 'Low' },
        { value: 850000, name: 'Medium' },
        { value: 235000, name: 'High' },
        { value: 85000, name: 'Critical' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>IBK 카드고객 이탈방지 대시보드</h1>
      
      {/* KPI 카드 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 카드회원"
              value={stats.totalCustomers}
              precision={0}
              prefix={<UserOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="현재 이탈률"
              value={stats.churnRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="고위험군 고객"
              value={stats.atRiskCustomers}
              precision={0}
              prefix={<AlertOutlined />}
              suffix="명"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="방지 매출 (예상)"
              value={stats.preventedRevenue / 100000000}
              precision={0}
              suffix="억원"
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 차트 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <ReactECharts option={trendChartOption} style={{ height: '400px' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={riskDistributionOption} style={{ height: '400px' }} />
          </Card>
        </Col>
      </Row>

      {/* Critical Alert */}
      <Card 
        title="⚠️ 즉시 개입 필요 (Critical)" 
        style={{ marginTop: '24px' }}
        headStyle={{ background: '#fff1f0', color: '#cf1322' }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Card type="inner">
              <Statistic
                title="고가치 고객 이탈 위험"
                value={1234}
                suffix="명"
              />
              <Progress percent={85} status="exception" />
            </Card>
          </Col>
          <Col span={8}>
            <Card type="inner">
              <Statistic
                title="90일 이상 미사용"
                value={3456}
                suffix="명"
              />
              <Progress percent={65} status="exception" />
            </Card>
          </Col>
          <Col span={8}>
            <Card type="inner">
              <Statistic
                title="경쟁사 전환 징후"
                value={789}
                suffix="명"
              />
              <Progress percent={45} status="exception" />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
