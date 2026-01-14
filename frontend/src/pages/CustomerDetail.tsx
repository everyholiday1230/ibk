import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Table,
  Tabs,
  Button,
  Space,
  Spin,
  Alert,
  message,
  Modal,
  Input,
  Select,
} from 'antd';
import {
  UserOutlined,
  AlertOutlined,
  HistoryOutlined,
  FileTextOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import apiClient from '../services/api';
import type { EChartsOption } from 'echarts';

const { TextArea } = Input;
const { Option } = Select;

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [shapData, setShapData] = useState<any>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('일반');
  const [counselingModalVisible, setCounselingModalVisible] = useState(false);
  const [counselingType, setCounselingType] = useState('phone');
  const [counselingNote, setCounselingNote] = useState('');
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [campaignType, setCampaignType] = useState('sms');
  const [campaignMessage, setCampaignMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [customerData, shapExplanation] = await Promise.all([
        apiClient.getCustomerDetail(id!),
        apiClient.explainPrediction(id!),
      ]);
      setCustomer(customerData);
      setShapData(shapExplanation);
    } catch (error) {
      message.error('고객 정보를 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      await apiClient.addCustomerNote(id!, {
        content: noteContent,
        type: noteType,
      });
      message.success('메모가 추가되었습니다');
      setNoteModalVisible(false);
      setNoteContent('');
    } catch (error) {
      message.error('메모 추가에 실패했습니다');
    }
  };

  // 긴급 상담 요청
  const handleCounselingRequest = async () => {
    try {
      await apiClient.addCustomerNote(id!, {
        content: `[긴급 상담 요청 - ${counselingType === 'phone' ? '전화' : counselingType === 'video' ? '화상' : '방문'}] ${counselingNote}`,
        type: '상담',
      });
      message.success('긴급 상담 요청이 등록되었습니다. 담당자가 곧 연락드릴 예정입니다.');
      setCounselingModalVisible(false);
      setCounselingNote('');
    } catch (error) {
      message.error('상담 요청에 실패했습니다');
    }
  };

  // 맞춤 캠페인 발송
  const handleCampaignSend = async () => {
    try {
      await apiClient.addCustomerNote(id!, {
        content: `[맞춤 캠페인 발송 - ${campaignType.toUpperCase()}] ${campaignMessage}`,
        type: '캠페인',
      });
      message.success(`${campaignType.toUpperCase()} 캠페인이 발송되었습니다.`);
      setCampaignModalVisible(false);
      setCampaignMessage('');
    } catch (error) {
      message.error('캠페인 발송에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="고객 정보를 불러오는 중..." />
      </div>
    );
  }

  if (!customer) {
    return <Alert message="고객 정보를 찾을 수 없습니다" type="error" />;
  }

  // SHAP 차트
  const shapChartOption: EChartsOption = {
    title: { text: 'AI 예측 설명 (SHAP Values)', left: 'center' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>영향도: ${data.value > 0 ? '+' : ''}${data.value.toFixed(4)}`;
      },
    },
    grid: { left: '20%', right: '10%', bottom: '10%', top: '15%' },
    xAxis: {
      type: 'value',
      name: '이탈 확률 영향도',
      axisLine: { lineStyle: { color: '#999' } },
    },
    yAxis: {
      type: 'category',
      data: shapData?.shap_values
        .sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value))
        .map((v: any) => v.feature_name_kr),
      axisLine: { lineStyle: { color: '#999' } },
    },
    series: [
      {
        type: 'bar',
        data: shapData?.shap_values
          .sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value))
          .map((v: any) => ({
            value: v.value,
            itemStyle: {
              color: v.value > 0 ? '#ff4d4f' : '#52c41a',
            },
          })),
      },
    ],
  };

  // 예측 이력 차트
  const predictionHistoryChartOption: EChartsOption = {
    title: { text: '위험도 변화 추이', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: customer.prediction_history?.map((p: any) => p.date) || [],
    },
    yAxis: {
      type: 'value',
      name: '위험도',
      min: 0,
      max: 100,
    },
    series: [
      {
        name: '위험도',
        type: 'line',
        data: customer.prediction_history?.map((p: any) => p.risk_score) || [],
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0)' },
            ],
          },
        },
      },
    ],
  };

  // 거래 내역 컬럼
  const transactionColumns = [
    {
      title: '거래일시',
      dataIndex: 'date',
      key: 'date',
      width: 150,
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '가맹점',
      dataIndex: 'merchant',
      key: 'merchant',
      width: 150,
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        <UserOutlined /> 고객 상세 정보
      </h1>

      {/* 기본 정보 & 위험도 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="기본 정보">
            <Descriptions column={2}>
              <Descriptions.Item label="고객 ID">{customer.customer_id}</Descriptions.Item>
              <Descriptions.Item label="이름">{customer.name}</Descriptions.Item>
              <Descriptions.Item label="나이">{customer.age}세</Descriptions.Item>
              <Descriptions.Item label="성별">
                {customer.gender === 'M' ? '남성' : '여성'}
              </Descriptions.Item>
              <Descriptions.Item label="지역">{customer.region}</Descriptions.Item>
              <Descriptions.Item label="직업">{customer.occupation}</Descriptions.Item>
              <Descriptions.Item label="가입일">{customer.join_date}</Descriptions.Item>
              <Descriptions.Item label="카드 종류">
                {customer.details?.card_type}
              </Descriptions.Item>
              <Descriptions.Item label="최근 거래일">
                {customer.last_transaction_date}
              </Descriptions.Item>
              <Descriptions.Item label="생애 거래 건수">
                {customer.details?.total_transactions_lifetime}건
              </Descriptions.Item>
              <Descriptions.Item label="생애 거래 금액">
                {(customer.details?.total_amount_lifetime / 10000).toFixed(0)}만원
              </Descriptions.Item>
              <Descriptions.Item label="선호 카테고리">
                {customer.details?.favorite_categories.join(', ')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={<span><AlertOutlined /> 이탈 위험 분석</span>}
            style={{ height: '100%' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, fontWeight: 'bold', color: '#ff4d4f' }}>
                {customer.risk_score}
              </div>
              <div style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
                위험도 점수
              </div>
              <Tag
                color={
                  customer.risk_level === 'CRITICAL'
                    ? 'red'
                    : customer.risk_level === 'HIGH'
                    ? 'orange'
                    : 'blue'
                }
                style={{ fontSize: 16, padding: '4px 12px', marginTop: 12 }}
              >
                {customer.risk_level}
              </Tag>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="이탈 확률">
                {(customer.churn_probability * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="생애주기">
                {
                  ({
                    onboarding: '온보딩',
                    growth: '성장',
                    maturity: '성숙',
                    decline: '감소',
                    at_risk: '위험',
                  } as Record<string, string>)[customer.lifecycle_stage] || customer.lifecycle_stage
                }
              </Descriptions.Item>
              <Descriptions.Item label="월 평균 사용액">
                {(customer.monthly_avg_amount / 10000).toFixed(0)}만원
              </Descriptions.Item>
              <Descriptions.Item label="예상 LTV">
                {(customer.ltv_estimate / 10000).toFixed(0)}만원
              </Descriptions.Item>
            </Descriptions>
            <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
              <Button type="primary" danger block icon={<PhoneOutlined />} onClick={() => setCounselingModalVisible(true)}>
                긴급 상담 요청
              </Button>
              <Button block icon={<MailOutlined />} onClick={() => setCampaignModalVisible(true)}>
                맞춤 캠페인 발송
              </Button>
              <Button block icon={<FileTextOutlined />} onClick={() => setNoteModalVisible(true)}>
                메모 추가
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* SHAP 설명 */}
      <Card title="AI 예측 설명 (SHAP)" style={{ marginBottom: 16 }}>
        <Alert
          message="이탈 확률에 영향을 미치는 주요 요인"
          description={`현재 예측 이탈 확률: ${(shapData?.prediction * 100).toFixed(1)}% (기준값: ${
            (shapData?.base_value * 100).toFixed(1)
          }%)`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <ReactECharts option={shapChartOption} style={{ height: 400 }} />
      </Card>

      {/* 탭 컨텐츠 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'transactions',
              label: <span><HistoryOutlined /> 거래 내역</span>,
              children: (
                <Table
                  columns={transactionColumns}
                  dataSource={customer.recent_transactions}
                  rowKey={(record: any, index) => `${record?.date || index}_${index}`}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'prediction_history',
              label: <span><AlertOutlined /> 위험도 변화</span>,
              children: (
                <>
                  <ReactECharts option={predictionHistoryChartOption} style={{ height: 400 }} />
                  <Table
                    columns={[
                      { title: '날짜', dataIndex: 'date', key: 'date' },
                      {
                        title: '위험도',
                        dataIndex: 'risk_score',
                        key: 'risk_score',
                        render: (score: number) => (
                          <Tag
                            color={score >= 90 ? 'red' : score >= 70 ? 'orange' : 'blue'}
                          >
                            {score}
                          </Tag>
                        ),
                      },
                      {
                        title: '이탈 확률',
                        dataIndex: 'churn_probability',
                        key: 'churn_probability',
                        render: (prob: number) => `${(prob * 100).toFixed(1)}%`,
                      },
                    ]}
                    dataSource={customer.prediction_history}
                    rowKey="date"
                    pagination={false}
                    size="small"
                  />
                </>
              ),
            },
            {
              key: 'recommended_actions',
              label: <span><FileTextOutlined /> 권장 액션</span>,
              children: (
                <div>
                  <Alert
                    message="AI 추천 액션"
                    description="고객의 이탈 위험도와 특성을 고려한 맞춤형 액션입니다"
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  {shapData?.shap_values
                    .filter((v: any) => v.value > 0.05)
                    .map((v: any, index: number) => (
                      <Card
                        key={index}
                        size="small"
                        style={{ marginBottom: 8 }}
                        title={`${index + 1}. ${v.feature_name_kr}`}
                      >
                        <p>
                          <strong>현재 상태:</strong> {v.feature_value}
                        </p>
                        <p>
                          <strong>영향도:</strong>{' '}
                          <Tag color={v.value > 0 ? 'red' : 'green'}>
                            {v.value > 0 ? '위험 증가' : '위험 감소'} (
                            {(v.value * 100).toFixed(2)}%)
                          </Tag>
                        </p>
                        <p>
                          <strong>권장 액션:</strong>
                          {v.feature === 'days_since_last_txn' &&
                            ' 즉시 Win-back 캠페인 발송 (쿠폰 + 특별 혜택)'}
                          {v.feature === 'recent_3m_amount' &&
                            ' 사용 활성화 프로모션 (포인트 2배)'}
                          {v.feature === 'decline_rate' &&
                            ' 원인 분석 후 맞춤형 혜택 제공'}
                        </p>
                      </Card>
                    ))}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 메모 추가 모달 */}
      <Modal
        title="고객 메모 추가"
        open={noteModalVisible}
        onOk={handleAddNote}
        onCancel={() => setNoteModalVisible(false)}
        okText="저장"
        cancelText="취소"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            placeholder="메모 유형"
            style={{ width: '100%' }}
            value={noteType}
            onChange={setNoteType}
          >
            <Option value="일반">일반</Option>
            <Option value="상담">상담</Option>
            <Option value="캠페인">캠페인</Option>
            <Option value="불만">불만</Option>
          </Select>
          <TextArea
            placeholder="메모 내용을 입력하세요"
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </Space>
      </Modal>

      {/* 긴급 상담 요청 모달 */}
      <Modal
        title="긴급 상담 요청"
        open={counselingModalVisible}
        onOk={handleCounselingRequest}
        onCancel={() => {
          setCounselingModalVisible(false);
          setCounselingNote('');
        }}
        okText="상담 요청"
        cancelText="취소"
      >
        <Alert
          message="긴급 상담 안내"
          description="이 고객은 이탈 위험도가 높습니다. 즉시 상담을 통해 이탈을 방지하세요."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>상담 방식:</strong>
            <Select
              value={counselingType}
              onChange={setCounselingType}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="phone">전화 상담</Option>
              <Option value="video">화상 상담</Option>
              <Option value="visit">방문 상담</Option>
            </Select>
          </div>
          <div style={{ marginTop: 16 }}>
            <strong>상담 내용:</strong>
            <TextArea
              rows={4}
              placeholder="상담 시 전달할 내용을 입력하세요..."
              value={counselingNote}
              onChange={(e) => setCounselingNote(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* 맞춤 캠페인 발송 모달 */}
      <Modal
        title="맞춤 캠페인 발송"
        open={campaignModalVisible}
        onOk={handleCampaignSend}
        onCancel={() => {
          setCampaignModalVisible(false);
          setCampaignMessage('');
        }}
        okText="발송"
        cancelText="취소"
      >
        <Alert
          message="맞춤형 캠페인"
          description="고객 특성에 맞는 맞춤형 혜택을 발송합니다."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>발송 채널:</strong>
            <Select
              value={campaignType}
              onChange={setCampaignType}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="sms">SMS 문자</Option>
              <Option value="email">이메일</Option>
              <Option value="push">앱 푸시 알림</Option>
              <Option value="kakao">카카오톡 알림톡</Option>
            </Select>
          </div>
          <div style={{ marginTop: 16 }}>
            <strong>캠페인 메시지:</strong>
            <TextArea
              rows={4}
              placeholder="고객에게 보낼 메시지를 입력하세요...
예시: [IBK] 특별 혜택! 이번 달 카드 사용 시 포인트 2배 적립!"
              value={campaignMessage}
              onChange={(e) => setCampaignMessage(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default CustomerDetail;
