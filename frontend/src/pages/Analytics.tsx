import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tabs, Spin, Alert, message, Tag } from 'antd';
import { BarChartOutlined, ClusterOutlined, LineChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import apiClient from '../services/api';
import type { EChartsOption } from 'echarts';

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [clustersData, featuresData] = await Promise.all([
        apiClient.getClusters(),
        apiClient.getFeatureImportance(),
      ]);
      setClusters(clustersData);
      setFeatureImportance(featuresData);
    } catch (error) {
      message.error('분석 데이터를 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="분석 데이터를 불러오는 중..." />
      </div>
    );
  }

  if (!clusters || !featureImportance) {
    return <Alert message="데이터를 불러올 수 없습니다" type="error" />;
  }

  // 군집 분포 차트
  const clusterDistributionOption: EChartsOption = {
    title: { text: '고객 군집 분포', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}명 ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: clusters.clusters.map((c: any) => ({
          value: c.size,
          name: c.name,
        })),
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

  // 군집별 이탈률 차트
  const clusterChurnRateOption: EChartsOption = {
    title: { text: '군집별 이탈률', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: clusters.clusters.map((c: any) => c.name),
      axisLabel: { rotate: 30, interval: 0 },
    },
    yAxis: { type: 'value', name: '이탈률 (%)' },
    series: [
      {
        type: 'bar',
        data: clusters.clusters.map((c: any) => ({
          value: c.churn_rate,
          itemStyle: {
            color: c.churn_rate > 30 ? '#ff4d4f' : c.churn_rate > 15 ? '#faad14' : '#52c41a',
          },
        })),
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
        },
      },
    ],
  };

  // 군집별 평균 위험도
  const clusterRiskScoreOption: EChartsOption = {
    title: { text: '군집별 평균 위험도', left: 'center' },
    tooltip: { trigger: 'axis' },
    radar: {
      indicator: clusters.clusters.map((c: any) => ({
        name: c.name,
        max: 100,
      })),
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: clusters.clusters.map((c: any) => c.avg_risk_score),
            name: '평균 위험도',
            itemStyle: { color: '#1890ff' },
            areaStyle: { opacity: 0.3 },
          },
        ],
      },
    ],
  };

  // Feature 중요도 차트
  const featureImportanceOption: EChartsOption = {
    title: { text: 'Feature 중요도 (Top 10)', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '20%', right: '10%', bottom: '10%', top: '15%' },
    xAxis: { type: 'value', name: '중요도' },
    yAxis: {
      type: 'category',
      data: featureImportance.top_10.map((f: any) => f.name_kr),
      inverse: true,
    },
    series: [
      {
        type: 'bar',
        data: featureImportance.top_10.map((f: any) => ({
          value: f.importance,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#1890ff' },
                { offset: 1, color: '#096dd9' },
              ],
            },
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => (params.value * 100).toFixed(1) + '%',
        },
      },
    ],
  };

  // 군집 테이블 컬럼
  const clusterColumns = [
    {
      title: 'Cluster',
      dataIndex: 'cluster_id',
      key: 'cluster_id',
      width: 80,
    },
    {
      title: '군집명',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '고객 수',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => size.toLocaleString() + '명',
      sorter: (a: any, b: any) => a.size - b.size,
    },
    {
      title: '비율',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      render: (pct: number) => `${pct.toFixed(1)}%`,
    },
    {
      title: '평균 위험도',
      dataIndex: 'avg_risk_score',
      key: 'avg_risk_score',
      width: 120,
      render: (score: number) => (
        <Tag color={score >= 70 ? 'red' : score >= 50 ? 'orange' : 'green'}>{score}</Tag>
      ),
      sorter: (a: any, b: any) => a.avg_risk_score - b.avg_risk_score,
    },
    {
      title: '이탈률',
      dataIndex: 'churn_rate',
      key: 'churn_rate',
      width: 100,
      render: (rate: number) => `${rate.toFixed(1)}%`,
      sorter: (a: any, b: any) => a.churn_rate - b.churn_rate,
    },
    {
      title: '특성',
      dataIndex: 'characteristics',
      key: 'characteristics',
      ellipsis: true,
    },
    {
      title: '권장 전략',
      dataIndex: 'recommended_strategy',
      key: 'recommended_strategy',
      ellipsis: true,
    },
  ];

  // Feature 테이블 컬럼
  const featureColumns = [
    {
      title: '순위',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
    },
    {
      title: 'Feature',
      dataIndex: 'name_kr',
      key: 'name_kr',
      width: 180,
    },
    {
      title: '기술명',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '중요도',
      dataIndex: 'importance',
      key: 'importance',
      width: 150,
      render: (imp: number) => (
        <div>
          <div style={{ marginBottom: 4 }}>{(imp * 100).toFixed(2)}%</div>
          <div
            style={{
              width: '100%',
              height: 8,
              backgroundColor: '#f0f0f0',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${imp * 100}%`,
                height: '100%',
                backgroundColor: '#1890ff',
              }}
            />
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.importance - b.importance,
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        <BarChartOutlined /> 고급 분석
      </h1>

      <Alert
        message="분석 정보"
        description={
          <div>
            <p>
              <strong>군집 분석:</strong> {clusters.clustering_method}
            </p>
            <p>
              <strong>사용 Features:</strong> {clusters.features_used}개
            </p>
            <p>
              <strong>Silhouette Score:</strong> {clusters.silhouette_score}
            </p>
            <p>
              <strong>Feature 중요도 방법:</strong> {featureImportance.importance_method}
            </p>
            <p>
              <strong>모델:</strong> {featureImportance.model_type}
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            {
              key: 'cluster_overview',
              label: (
                <span>
                  <ClusterOutlined /> 군집 개요
                </span>
              ),
              children: (
                <Row gutter={16}>
                  <Col span={12}>
                    <ReactECharts option={clusterDistributionOption} style={{ height: 400 }} />
                  </Col>
                  <Col span={12}>
                    <ReactECharts option={clusterChurnRateOption} style={{ height: 400 }} />
                  </Col>
                </Row>
              ),
            },
            {
              key: 'cluster_details',
              label: (
                <span>
                  <ClusterOutlined /> 군집 상세
                </span>
              ),
              children: (
                <>
                  <ReactECharts option={clusterRiskScoreOption} style={{ height: 400, marginBottom: 16 }} />
                  <Table
                    dataSource={clusters.clusters}
                    columns={clusterColumns}
                    rowKey="cluster_id"
                    pagination={false}
                    scroll={{ x: 1400 }}
                  />
                </>
              ),
            },
            {
              key: 'feature_importance',
              label: (
                <span>
                  <LineChartOutlined /> Feature 중요도
                </span>
              ),
              children: (
                <>
                  <ReactECharts option={featureImportanceOption} style={{ height: 500, marginBottom: 16 }} />
                  <Table
                    dataSource={featureImportance.top_10}
                    columns={featureColumns}
                    rowKey="rank"
                    pagination={false}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Analytics;
