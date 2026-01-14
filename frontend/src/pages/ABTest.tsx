/**
 * A/B 테스트 관리 페이지
 * - 캠페인 효과 비교 시스템
 * - 통계적 유의성 검정
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Button, Tag, Modal, Form, Input, Select,
  InputNumber, DatePicker, Tabs, Statistic, Progress, Alert, message,
  Spin, Space, Descriptions, Tooltip, Typography
} from 'antd';
import {
  ExperimentOutlined, PlusOutlined, BarChartOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TrophyOutlined, WarningOutlined, InfoCircleOutlined,
  ReloadOutlined, RocketOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface ABTest {
  id: number;
  test_name: string;
  status: string;
  hypothesis: string;
  target_segment: string;
  primary_metric: string;
  start_date: string;
  end_date: string;
  group_a_name: string;
  group_b_name: string;
  sample_size: number;
  winner: string | null;
  lift: number | null;
  is_significant: boolean | null;
  created_at: string;
}

const ABTest: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [form] = Form.useForm();
  const [analyzeForm] = Form.useForm();

  useEffect(() => {
    loadABTests();
  }, []);

  const loadABTests = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getABTests();
      setTests(data);
    } catch (error) {
      console.error('A/B 테스트 목록 로드 실패:', error);
      message.error('A/B 테스트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (values: any) => {
    try {
      const payload = {
        ...values,
        start_date: values.dates[0].toISOString(),
        end_date: values.dates[1]?.toISOString(),
      };
      delete payload.dates;

      await apiClient.createABTest(payload);
      message.success('A/B 테스트가 생성되었습니다.');
      setModalVisible(false);
      form.resetFields();
      loadABTests();
    } catch (error) {
      message.error('A/B 테스트 생성에 실패했습니다.');
    }
  };

  const handleViewDetail = async (testId: number) => {
    try {
      const data = await apiClient.getABTestDetail(testId);
      setSelectedTest(data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('테스트 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleAnalyze = async (values: any) => {
    if (!selectedTest) return;

    try {
      const result = await apiClient.analyzeABTest(selectedTest.id, values);
      setAnalysisResult(result);
      message.success('분석이 완료되었습니다.');
      loadABTests();
    } catch (error) {
      message.error('분석에 실패했습니다.');
    }
  };

  const openAnalyzeModal = (test: ABTest) => {
    setSelectedTest(test);
    analyzeForm.setFieldsValue({
      group_a_size: test.sample_size * 0.5,
      group_b_size: test.sample_size * 0.5,
    });
    setAnalysisResult(null);
    setAnalyzeModalVisible(true);
  };

  const getStatusTag = (status: string) => {
    const config: { [key: string]: { color: string; icon: React.ReactNode } } = {
      '준비중': { color: 'default', icon: <ClockCircleOutlined /> },
      '진행중': { color: 'processing', icon: <RocketOutlined /> },
      '분석중': { color: 'warning', icon: <BarChartOutlined /> },
      '완료': { color: 'success', icon: <CheckCircleOutlined /> },
    };
    const { color, icon } = config[status] || { color: 'default', icon: null };
    return <Tag color={color} icon={icon}>{status}</Tag>;
  };

  const getWinnerTag = (winner: string | null) => {
    if (!winner || winner === 'NONE') {
      return <Tag color="default">결과 없음</Tag>;
    }
    return (
      <Tag color="gold" icon={<TrophyOutlined />}>
        {winner} 그룹 승리
      </Tag>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      responsive: ['md'] as ('md')[] as import('antd').Breakpoint[],
    },
    {
      title: '테스트명',
      dataIndex: 'test_name',
      key: 'test_name',
      ellipsis: true,
      render: (text: string, record: ABTest) => (
        <a onClick={() => handleViewDetail(record.id)}>{text}</a>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '대상 세그먼트',
      dataIndex: 'target_segment',
      key: 'target_segment',
      width: 150,
      ellipsis: true,
      responsive: ['lg'] as ('lg')[] as import('antd').Breakpoint[],
    },
    {
      title: '주요 지표',
      dataIndex: 'primary_metric',
      key: 'primary_metric',
      width: 120,
      responsive: ['md'] as ('md')[] as import('antd').Breakpoint[],
      render: (metric: string) => {
        const labels: { [key: string]: string } = {
          'churn_rate': '이탈률',
          'conversion_rate': '전환율',
          'engagement_rate': '참여율',
        };
        return labels[metric] || metric;
      },
    },
    {
      title: '샘플 크기',
      dataIndex: 'sample_size',
      key: 'sample_size',
      width: 100,
      responsive: ['lg'] as ('lg')[] as import('antd').Breakpoint[],
      render: (size: number) => size?.toLocaleString(),
    },
    {
      title: 'Lift',
      dataIndex: 'lift',
      key: 'lift',
      width: 100,
      render: (lift: number | null, record: ABTest) => {
        if (lift === null || lift === undefined) return '-';
        const color = lift > 0 ? 'green' : lift < 0 ? 'red' : 'default';
        return (
          <Text style={{ color: lift > 0 ? '#52c41a' : lift < 0 ? '#ff4d4f' : undefined }}>
            {lift > 0 ? '+' : ''}{lift.toFixed(1)}%
          </Text>
        );
      },
    },
    {
      title: '결과',
      dataIndex: 'winner',
      key: 'winner',
      width: 120,
      render: (winner: string | null, record: ABTest) => (
        <>
          {getWinnerTag(winner)}
          {record.is_significant && (
            <Tooltip title="통계적으로 유의미">
              <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 4 }} />
            </Tooltip>
          )}
        </>
      ),
    },
    {
      title: '액션',
      key: 'action',
      width: 120,
      render: (_: any, record: ABTest) => (
        <Space size="small">
          <Button size="small" onClick={() => handleViewDetail(record.id)}>
            상세
          </Button>
          {record.status === '진행중' && (
            <Button size="small" type="primary" onClick={() => openAnalyzeModal(record)}>
              분석
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 통계 요약
  const stats = {
    total: tests.length,
    running: tests.filter(t => t.status === '진행중').length,
    completed: tests.filter(t => t.status === '완료').length,
    significant: tests.filter(t => t.is_significant).length,
    avgLift: tests.filter(t => t.lift).reduce((acc, t) => acc + (t.lift || 0), 0) / 
             tests.filter(t => t.lift).length || 0,
  };

  // 차트 데이터
  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['A 그룹', 'B 그룹'] },
    xAxis: {
      type: 'category',
      data: tests.slice(0, 5).map(t => t.test_name.substring(0, 10) + '...'),
    },
    yAxis: { type: 'value', name: '성과 지표 (%)' },
    series: [
      {
        name: 'A 그룹',
        type: 'bar',
        data: [13.0, 25.0, 18.5, 22.0, 15.5],
        itemStyle: { color: '#1890ff' },
      },
      {
        name: 'B 그룹',
        type: 'bar',
        data: [16.0, 28.5, 20.2, 24.5, 17.8],
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  return (
    <div className="abtest-page">
      {/* 헤더 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={3} style={{ color: '#fff', margin: 0 }}>
                  <ExperimentOutlined /> A/B 테스트 관리
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  캠페인 효과 비교 및 통계적 유의성 검정
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadABTests}>
                    새로고침
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalVisible(true)}
                    style={{ background: '#fff', color: '#667eea' }}
                  >
                    새 테스트
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="전체 테스트"
              value={stats.total}
              suffix="건"
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="진행중"
              value={stats.running}
              suffix="건"
              valueStyle={{ color: '#1890ff' }}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="완료"
              value={stats.completed}
              suffix="건"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="평균 Lift"
              value={stats.avgLift}
              precision={1}
              suffix="%"
              valueStyle={{ color: stats.avgLift > 0 ? '#52c41a' : '#ff4d4f' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 차트 & 테이블 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="최근 테스트 성과 비교" extra={<InfoCircleOutlined />}>
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="A/B 테스트 목록">
            <Table
              columns={columns}
              dataSource={tests}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 800 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 새 테스트 모달 */}
      <Modal
        title={<><ExperimentOutlined /> 새 A/B 테스트 생성</>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTest}>
          <Form.Item
            name="test_name"
            label="테스트명"
            rules={[{ required: true, message: '테스트명을 입력하세요' }]}
          >
            <Input placeholder="예: 휴면 고객 Win-back 메시지 효과 비교" />
          </Form.Item>

          <Form.Item
            name="hypothesis"
            label="가설"
            rules={[{ required: true, message: '가설을 입력하세요' }]}
          >
            <TextArea
              rows={2}
              placeholder="예: 개인화된 메시지가 일반 메시지보다 전환율이 높을 것이다"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="target_segment"
                label="대상 세그먼트"
                rules={[{ required: true }]}
              >
                <Select placeholder="선택">
                  <Select.Option value="휴면 위험군">휴면 위험군</Select.Option>
                  <Select.Option value="이탈 위험 고객">이탈 위험 고객</Select.Option>
                  <Select.Option value="신규 고객">신규 고객</Select.Option>
                  <Select.Option value="VIP 고객">VIP 고객</Select.Option>
                  <Select.Option value="전체 고객">전체 고객</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="primary_metric"
                label="주요 측정 지표"
                rules={[{ required: true }]}
              >
                <Select placeholder="선택">
                  <Select.Option value="churn_rate">이탈률</Select.Option>
                  <Select.Option value="conversion_rate">전환율</Select.Option>
                  <Select.Option value="engagement_rate">참여율</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="sample_size"
                label="샘플 크기"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={100}
                  max={100000}
                  style={{ width: '100%' }}
                  placeholder="최소 100명"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="dates"
                label="테스트 기간"
                rules={[{ required: true }]}
              >
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="group_a_description"
                label="A 그룹 (통제군) 설명"
                rules={[{ required: true }]}
              >
                <Input placeholder="예: 기존 일반 메시지 발송" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="group_b_description"
                label="B 그룹 (실험군) 설명"
                rules={[{ required: true }]}
              >
                <Input placeholder="예: 개인화 메시지 발송" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                테스트 생성
              </Button>
              <Button onClick={() => setModalVisible(false)}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 상세 보기 모달 */}
      <Modal
        title={<><BarChartOutlined /> 테스트 상세 정보</>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={<Button onClick={() => setDetailModalVisible(false)}>닫기</Button>}
        width={800}
      >
        {selectedTest && (
          <>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="테스트명" span={2}>
                {selectedTest.test_name}
              </Descriptions.Item>
              <Descriptions.Item label="가설" span={2}>
                {selectedTest.hypothesis}
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                {getStatusTag(selectedTest.status)}
              </Descriptions.Item>
              <Descriptions.Item label="대상 세그먼트">
                {selectedTest.target_segment}
              </Descriptions.Item>
              <Descriptions.Item label="시작일">
                {dayjs(selectedTest.start_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="종료일">
                {selectedTest.end_date ? dayjs(selectedTest.end_date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedTest.group_a && selectedTest.group_b && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} md={12}>
                  <Card
                    title={`A 그룹: ${selectedTest.group_a.name}`}
                    size="small"
                    style={{ borderColor: '#1890ff' }}
                  >
                    <p>{selectedTest.group_a.description}</p>
                    <Statistic
                      title="성과 지표"
                      value={selectedTest.group_a.metric_value || 0}
                      suffix="%"
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">참가자: {selectedTest.group_a.size}명</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card
                    title={`B 그룹: ${selectedTest.group_b.name}`}
                    size="small"
                    style={{ borderColor: '#52c41a' }}
                  >
                    <p>{selectedTest.group_b.description}</p>
                    <Statistic
                      title="성과 지표"
                      value={selectedTest.group_b.metric_value || 0}
                      suffix="%"
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">참가자: {selectedTest.group_b.size}명</Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            )}

            {selectedTest.results && selectedTest.results.winner && (
              <Alert
                style={{ marginTop: 16 }}
                type={selectedTest.results.is_significant ? 'success' : 'info'}
                showIcon
                message={
                  selectedTest.results.is_significant
                    ? `통계적으로 유의미한 결과 (p=${selectedTest.results.p_value?.toFixed(4)})`
                    : '통계적 유의성 없음'
                }
                description={selectedTest.results.conclusion}
              />
            )}
          </>
        )}
      </Modal>

      {/* 분석 모달 */}
      <Modal
        title={<><BarChartOutlined /> A/B 테스트 분석</>}
        open={analyzeModalVisible}
        onCancel={() => setAnalyzeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={analyzeForm} layout="vertical" onFinish={handleAnalyze}>
          <Alert
            message="측정값 입력"
            description="테스트 기간 동안 수집된 A/B 그룹의 성과 지표를 입력하세요."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="group_a_metric_value"
                label="A 그룹 (통제군) 성과 (%)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="group_b_metric_value"
                label="B 그룹 (실험군) 성과 (%)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="group_a_size"
                label="A 그룹 참가자 수"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="group_b_size"
                label="B 그룹 참가자 수"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              통계적 유의성 검정 실행
            </Button>
          </Form.Item>
        </Form>

        {analysisResult && (
          <Card title="분석 결과" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Lift"
                  value={analysisResult.lift}
                  precision={2}
                  suffix="%"
                  valueStyle={{
                    color: analysisResult.lift > 0 ? '#52c41a' : '#ff4d4f',
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="P-value"
                  value={analysisResult.p_value}
                  precision={4}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="승자"
                  value={analysisResult.winner}
                  valueStyle={{
                    color: analysisResult.winner !== 'NONE' ? '#faad14' : undefined,
                  }}
                />
              </Col>
            </Row>
            <Alert
              style={{ marginTop: 16 }}
              type={analysisResult.is_significant ? 'success' : 'warning'}
              showIcon
              message={
                analysisResult.is_significant
                  ? '통계적으로 유의미한 결과입니다'
                  : '통계적 유의성이 없습니다'
              }
              description={analysisResult.conclusion}
            />
          </Card>
        )}
      </Modal>

      {/* 범온누리 브랜딩 */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card size="small" style={{ background: '#f5f5f5', textAlign: 'center' }}>
            <Text type="secondary">
              A/B 테스트 시스템 | (주)범온누리 이노베이션 | IBK 기업은행 이탈방지 AI 솔루션
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ABTest;
