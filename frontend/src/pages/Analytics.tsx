import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select } from 'antd';
import * as echarts from 'echarts';
import type { ColumnsType } from 'antd/es/table';

interface ClusterData {
  key: string;
  cluster_id: number;
  cluster_name: string;
  size: number;
  avg_churn_score: number;
  churn_rate: number;
  main_features: string;
}

const Analytics: React.FC = () => {
  const clusterData: ClusterData[] = [
    {
      key: '0',
      cluster_id: 0,
      cluster_name: '충성 고객',
      size: 2120000,
      avg_churn_score: 15,
      churn_rate: 5.0,
      main_features: '장기 가입, 높은 사용빈도, 다양한 업종'
    },
    {
      key: '1',
      cluster_id: 1,
      cluster_name: '가격 민감형',
      size: 1415000,
      avg_churn_score: 48,
      churn_rate: 20.0,
      main_features: '혜택 중심, 프로모션 반응 높음'
    },
    {
      key: '2',
      cluster_id: 2,
      cluster_name: '디지털 네이티브',
      size: 990000,
      avg_churn_score: 22,
      churn_rate: 8.0,
      main_features: '온라인 쇼핑, 배달앱, 젊은 층'
    },
    {
      key: '3',
      cluster_id: 3,
      cluster_name: '휴면 위험군',
      size: 708000,
      avg_churn_score: 76,
      churn_rate: 45.0,
      main_features: '사용 급감, 60일+ 미사용'
    },
    {
      key: '4',
      cluster_id: 4,
      cluster_name: '고가치 VIP',
      size: 353000,
      avg_churn_score: 12,
      churn_rate: 3.0,
      main_features: '고액 결제, 장기 거래, 법인카드'
    },
    {
      key: '5',
      cluster_id: 5,
      cluster_name: '신규 활성화 필요',
      size: 850000,
      avg_churn_score: 58,
      churn_rate: 25.0,
      main_features: '가입 6개월 미만, 낮은 활성률'
    },
    {
      key: '6',
      cluster_id: 6,
      cluster_name: '경쟁사 전환 의심',
      size: 635623,
      avg_churn_score: 85,
      churn_rate: 60.0,
      main_features: '급격한 사용 감소, 경쟁사 신호'
    },
  ];

  const columns: ColumnsType<ClusterData> = [
    {
      title: 'Cluster ID',
      dataIndex: 'cluster_id',
      key: 'cluster_id',
      width: 100,
    },
    {
      title: 'Cluster 명',
      dataIndex: 'cluster_name',
      key: 'cluster_name',
      width: 150,
    },
    {
      title: '고객 수',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => `${(size / 10000).toFixed(0)}만명`,
      sorter: (a, b) => b.size - a.size,
    },
    {
      title: '평균 이탈 점수',
      dataIndex: 'avg_churn_score',
      key: 'avg_churn_score',
      width: 130,
      render: (score: number) => (
        <span style={{ 
          fontWeight: 600,
          color: score >= 70 ? '#f5222d' : score >= 50 ? '#fa8c16' : '#52c41a'
        }}>
          {score}점
        </span>
      ),
      sorter: (a, b) => b.avg_churn_score - a.avg_churn_score,
    },
    {
      title: '실제 이탈률',
      dataIndex: 'churn_rate',
      key: 'churn_rate',
      width: 120,
      render: (rate: number) => `${rate.toFixed(1)}%`,
      sorter: (a, b) => b.churn_rate - a.churn_rate,
    },
    {
      title: '주요 특징',
      dataIndex: 'main_features',
      key: 'main_features',
    },
  ];

  useEffect(() => {
    // 1. Cluster별 이탈률 비교
    const clusterComparisonChart = echarts.init(document.getElementById('clusterComparisonChart')!);
    const clusterComparisonOption = {
      title: {
        text: 'Cluster별 이탈률 비교',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: clusterData.map(c => c.cluster_name),
        axisLabel: {
          interval: 0,
          rotate: 30
        }
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
          type: 'bar',
          data: clusterData.map(c => ({
            value: c.churn_rate,
            itemStyle: {
              color: c.churn_rate >= 40 ? '#f5222d' : 
                     c.churn_rate >= 20 ? '#fa8c16' : '#52c41a'
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        }
      ]
    };
    clusterComparisonChart.setOption(clusterComparisonOption);

    // 2. Cluster 크기 분포
    const clusterSizeChart = echarts.init(document.getElementById('clusterSizeChart')!);
    const clusterSizeOption = {
      title: {
        text: 'Cluster별 고객 분포',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}만명 ({d}%)'
      },
      legend: {
        bottom: 10,
        left: 'center'
      },
      series: [
        {
          name: 'Cluster',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: clusterData.map((c, i) => ({
            value: c.size / 10000,
            name: c.cluster_name,
            itemStyle: {
              color: ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#faad14', '#13c2c2', '#f5222d'][i]
            }
          }))
        }
      ]
    };
    clusterSizeChart.setOption(clusterSizeOption);

    // 3. Feature Importance (전체)
    const featureImportanceChart = echarts.init(document.getElementById('featureImportanceChart')!);
    const featureImportanceOption = {
      title: {
        text: 'Top 15 Feature Importance (SHAP)',
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
          'competitor_signal',
          'benefit_utilization',
          'usage_consistency',
          'main_card_prob',
          'category_dropout',
          'loyalty_score',
          'decline_rate',
          'category_diversity',
          'days_since_last_txn',
          'monetary_drop',
          'frequency_decline',
          'recency_days',
          'age',
          'region',
          'gender'
        ].reverse()
      },
      series: [
        {
          name: 'SHAP Importance',
          type: 'bar',
          data: [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.20, 0.22, 0.24, 0.25].reverse(),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#52c41a' }
            ])
          }
        }
      ]
    };
    featureImportanceChart.setOption(featureImportanceOption);

    // 4. 모델 성능 지표
    const modelPerformanceChart = echarts.init(document.getElementById('modelPerformanceChart')!);
    const modelPerformanceOption = {
      title: {
        text: '모델 성능 비교 (XGBoost vs LightGBM vs RF)',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['XGBoost', 'LightGBM', 'Random Forest'],
        bottom: 10
      },
      radar: {
        indicator: [
          { name: 'AUC-ROC', max: 1.0 },
          { name: 'Precision', max: 1.0 },
          { name: 'Recall', max: 1.0 },
          { name: 'F1 Score', max: 1.0 },
          { name: 'F2 Score', max: 1.0 }
        ]
      },
      series: [
        {
          name: '모델 성능',
          type: 'radar',
          data: [
            {
              value: [0.87, 0.78, 0.82, 0.80, 0.81],
              name: 'XGBoost',
              itemStyle: { color: '#1890ff' }
            },
            {
              value: [0.86, 0.76, 0.84, 0.79, 0.82],
              name: 'LightGBM',
              itemStyle: { color: '#52c41a' }
            },
            {
              value: [0.83, 0.74, 0.78, 0.76, 0.77],
              name: 'Random Forest',
              itemStyle: { color: '#722ed1' }
            }
          ]
        }
      ]
    };
    modelPerformanceChart.setOption(modelPerformanceOption);

    const handleResize = () => {
      clusterComparisonChart.resize();
      clusterSizeChart.resize();
      featureImportanceChart.resize();
      modelPerformanceChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clusterComparisonChart.dispose();
      clusterSizeChart.dispose();
      featureImportanceChart.dispose();
      modelPerformanceChart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 모델 성능 지표 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="AUC-ROC"
              value={0.87}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              목표: ≥ 0.85 ✅
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Precision"
              value={0.78}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              목표: ≥ 0.75 ✅
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Recall"
              value={0.82}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              목표: ≥ 0.80 ✅
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="F2 Score"
              value={0.81}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              목표: ≥ 0.78 ✅
            </div>
          </Card>
        </Col>

        {/* 차트 영역 */}
        <Col span={12}>
          <Card>
            <div id="clusterComparisonChart" style={{ width: '100%', height: 350 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <div id="clusterSizeChart" style={{ width: '100%', height: 350 }} />
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <div id="featureImportanceChart" style={{ width: '100%', height: 400 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <div id="modelPerformanceChart" style={{ width: '100%', height: 400 }} />
          </Card>
        </Col>

        {/* Cluster 테이블 */}
        <Col span={24}>
          <Card 
            title="고객 군집(Cluster) 분석 상세"
            extra={
              <Select
                defaultValue="all"
                style={{ width: 200 }}
                options={[
                  { value: 'all', label: '전체 Cluster' },
                  { value: 'high_risk', label: '고위험 Cluster만' },
                  { value: 'low_risk', label: '저위험 Cluster만' }
                ]}
              />
            }
          >
            <Table
              columns={columns}
              dataSource={clusterData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
