/**
 * 이탈 방지 효과 추적 페이지
 * - 상담 후 실제 이탈 여부 측정
 * - 효과 분석 및 리포트
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Button, Tag, Modal, Form, Select, InputNumber,
  Tabs, Statistic, Progress, Spin, Space, Alert, message, Typography,
  Tooltip, Badge, Switch
} from 'antd';
import {
  SafetyOutlined, RiseOutlined, FallOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, ReloadOutlined,
  BarChartOutlined, UserOutlined, PhoneOutlined, GiftOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title, Text } = Typography;

const Retention: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [pendingMeasurements, setPendingMeasurements] = useState<any[]>([]);
  const [measureModalVisible, setMeasureModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [measureForm] = Form.useForm();
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [periodDays]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, pendingData] = await Promise.all([
        apiClient.getRetentionStats(periodDays),
        apiClient.getPendingMeasurements(),
      ]);
      setStats(statsData);
      setPendingMeasurements(pendingData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMeasure = async (values: any) => {
    if (!selectedRecord) return;

    try {
      await apiClient.updateRetentionMeasurement(selectedRecord.record_id, values);
      message.success('측정 결과가 저장되었습니다.');
      setMeasureModalVisible(false);
      measureForm.resetFields();
      loadData();
    } catch (error) {
      message.error('측정 결과 저장에 실패했습니다.');
    }
  };

  const openMeasureModal = (record: any) => {
    setSelectedRecord(record);
    measureForm.setFieldsValue({
      after_risk_score: record.before_risk_score - 10,
      after_churn_prob: Math.max(0, (record.before_risk_score - 10) / 100),
      has_churned: false,
    });
    setMeasureModalVisible(true);
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case '상담':
        return <PhoneOutlined style={{ color: '#1890ff' }} />;
      case '캠페인':
        return <GiftOutlined style={{ color: '#52c41a' }} />;
      case '쿠폰':
        return <GiftOutlined style={{ color: '#faad14' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const pendingColumns = [
    {
      title: '기록 ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 80,
      responsive: ['md'] as ('md')[] as import('antd').Breakpoint[],
    },
    {
      title: '고객',
      key: 'customer',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <UserOutlined />
          <Text>{record.customer_name}</Text>
        </Space>
      ),
    },
    {
      title: '액션 유형',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type: string) => (
        <Tag icon={getActionTypeIcon(type)}>
          {type}
        </Tag>
      ),
    },
    {
      title: '액션 일자',
      dataIndex: 'action_date',
      key: 'action_date',
      width: 100,
      responsive: ['lg'] as ('lg')[] as import('antd').Breakpoint[],
      render: (date: string) => dayjs(date).format('YY-MM-DD'),
    },
    {
      title: '측정 기한',
      dataIndex: 'measurement_end_date',
      key: 'measurement_end_date',
      width: 100,
      render: (date: string) => dayjs(date).format('YY-MM-DD'),
    },
    {
      title: '초과일',
      dataIndex: 'days_overdue',
      key: 'days_overdue',
      width: 80,
      render: (days: number) => (
        <Tag color={days > 7 ? 'red' : days > 3 ? 'orange' : 'default'}>
          {days}일
        </Tag>
      ),
    },
    {
      title: '기존 위험도',
      dataIndex: 'before_risk_score',
      key: 'before_risk_score',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 70 ? '#ff4d4f' : score >= 50 ? '#faad14' : '#52c41a'}
        />
      ),
    },
    {
      title: '액션',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => openMeasureModal(record)}
        >
          측정 입력
        </Button>
      ),
    },
  ];

  // 액션 유형별 성과 차트
  const actionTypeChartOption = stats?.by_action_type ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['성공률', '건수'] },
    xAxis: {
      type: 'category',
      data: Object.keys(stats.by_action_type),
    },
    yAxis: [
      { type: 'value', name: '성공률 (%)', min: 0, max: 100 },
      { type: 'value', name: '건수', position: 'right' },
    ],
    series: [
      {
        name: '성공률',
        type: 'bar',
        data: Object.values(stats.by_action_type).map((v: any) => v.success_rate),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '건수',
        type: 'line',
        yAxisIndex: 1,
        data: Object.values(stats.by_action_type).map((v: any) => v.total),
        itemStyle: { color: '#1890ff' },
      },
    ],
  } : null;

  // 효과 추이 차트
  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['이탈 방지 성공률', '평균 위험도 감소'] },
    xAxis: {
      type: 'category',
      data: ['1주차', '2주차', '3주차', '4주차', '5주차', '6주차'],
    },
    yAxis: { type: 'value', name: '%' },
    series: [
      {
        name: '이탈 방지 성공률',
        type: 'line',
        smooth: true,
        data: [72.5, 74.2, 75.8, 76.0, 77.5, 78.2],
        itemStyle: { color: '#52c41a' },
        areaStyle: { opacity: 0.3 },
      },
      {
        name: '평균 위험도 감소',
        type: 'line',
        smooth: true,
        data: [18.5, 20.2, 21.5, 22.5, 23.8, 24.2],
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  return (
    <div className="retention-page">
      {/* 헤더 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={3} style={{ color: '#fff', margin: 0 }}>
                  <SafetyOutlined /> 이탈 방지 효과 추적
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  상담/캠페인 후 실제 이탈 여부 측정 및 효과 분석
                </Text>
              </Col>
              <Col>
                <Space>
                  <Select
                    value={periodDays}
                    onChange={setPeriodDays}
                    style={{ width: 120, background: '#fff', borderRadius: 4 }}
                  >
                    <Select.Option value={7}>최근 7일</Select.Option>
                    <Select.Option value={30}>최근 30일</Select.Option>
                    <Select.Option value={90}>최근 90일</Select.Option>
                    <Select.Option value={180}>최근 180일</Select.Option>
                  </Select>
                  <Button icon={<ReloadOutlined />} onClick={loadData}>
                    새로고침
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 통계 카드 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="총 액션 건수"
                value={stats.total_records}
                suffix="건"
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="이탈 방지 성공"
                value={stats.successful_retentions}
                suffix="건"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="이탈 발생"
                value={stats.churned_customers}
                suffix="건"
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="성공률"
                value={stats.retention_success_rate}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="평균 위험도 감소"
                value={stats.average_risk_reduction}
                precision={1}
                suffix="점"
                valueStyle={{ color: '#1890ff' }}
                prefix={<FallOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="평균 사용액 변화"
                value={stats.average_amount_change_rate}
                precision={1}
                suffix="%"
                prefix={stats.average_amount_change_rate >= 0 ? <RiseOutlined /> : <FallOutlined />}
                valueStyle={{ color: stats.average_amount_change_rate >= 0 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 차트 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<><BarChartOutlined /> 액션 유형별 성과</>}>
            {actionTypeChartOption ? (
              <ReactECharts option={actionTypeChartOption} style={{ height: 280 }} />
            ) : (
              <Spin />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><RiseOutlined /> 효과 추이</>}>
            <ReactECharts option={trendChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 측정 대기 목록 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                측정 대기 목록
                <Badge count={pendingMeasurements.length} style={{ marginLeft: 8 }} />
              </Space>
            }
            extra={
              <Alert
                message="측정 기한이 지난 건에 대해 결과를 입력해주세요."
                type="info"
                showIcon
                style={{ marginBottom: 0, padding: '4px 12px' }}
              />
            }
          >
            <Table
              columns={pendingColumns}
              dataSource={pendingMeasurements}
              rowKey="record_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
              size="small"
              locale={{
                emptyText: '측정 대기 중인 건이 없습니다.',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 액션 유형별 상세 */}
      {stats?.by_action_type && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {Object.entries(stats.by_action_type).map(([type, data]: [string, any]) => (
            <Col xs={24} sm={12} md={8} key={type}>
              <Card>
                <Row align="middle" justify="space-between">
                  <Col>
                    <Space>
                      {getActionTypeIcon(type)}
                      <Text strong>{type}</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Tag color={data.success_rate >= 75 ? 'green' : data.success_rate >= 50 ? 'orange' : 'red'}>
                      {data.success_rate}%
                    </Tag>
                  </Col>
                </Row>
                <Row style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="총 건수"
                      value={data.total}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="성공"
                      value={data.successful}
                      valueStyle={{ fontSize: 20, color: '#52c41a' }}
                    />
                  </Col>
                </Row>
                <Progress
                  percent={data.success_rate}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 측정 입력 모달 */}
      <Modal
        title={<><SafetyOutlined /> 이탈 방지 결과 측정</>}
        open={measureModalVisible}
        onCancel={() => setMeasureModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedRecord && (
          <>
            <Alert
              message={`고객 ID: ${selectedRecord.customer_id}`}
              description={`액션 유형: ${selectedRecord.action_type} | 기존 위험도: ${selectedRecord.before_risk_score}점`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={measureForm} layout="vertical" onFinish={handleMeasure}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="after_risk_score"
                    label="현재 위험도 점수 (0-100)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="after_churn_prob"
                    label="현재 이탈 확률 (0-1)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="after_monthly_amount"
                label="현재 월 사용액 (만원)"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="has_churned"
                label="이탈 여부"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="이탈"
                  unCheckedChildren="유지"
                />
              </Form.Item>

              <Form.Item name="notes" label="비고">
                <Select placeholder="결과 선택">
                  <Select.Option value="성공적으로 이탈 방지됨">성공적으로 이탈 방지됨</Select.Option>
                  <Select.Option value="부분적 효과">부분적 효과</Select.Option>
                  <Select.Option value="효과 없음">효과 없음</Select.Option>
                  <Select.Option value="고객 이탈">고객 이탈</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    결과 저장
                  </Button>
                  <Button onClick={() => setMeasureModalVisible(false)}>취소</Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 범온누리 브랜딩 */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card size="small" style={{ background: '#f5f5f5', textAlign: 'center' }}>
            <Text type="secondary">
              이탈 방지 효과 추적 시스템 | (주)범온누리 이노베이션 | IBK 기업은행 이탈방지 AI 솔루션
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Retention;
