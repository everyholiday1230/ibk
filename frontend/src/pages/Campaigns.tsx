import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  message,
  Spin,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Campaigns: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [roiModalVisible, setRoiModalVisible] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [form] = Form.useForm();
  const [roiForm] = Form.useForm();
  const [roiResult, setRoiResult] = useState<any>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      message.error('캠페인 목록을 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCampaign(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingCampaign(record);
    form.setFieldsValue({
      ...record,
      dates: [dayjs(record.start_date), dayjs(record.end_date)],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.deleteCampaign(id);
      message.success('캠페인이 삭제되었습니다');
      loadCampaigns();
    } catch (error) {
      message.error('캠페인 삭제에 실패했습니다');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const campaignData = {
        ...values,
        start_date: values.dates[0].format('YYYY-MM-DD'),
        end_date: values.dates[1].format('YYYY-MM-DD'),
      };
      delete campaignData.dates;

      if (editingCampaign) {
        await apiClient.updateCampaign(editingCampaign.id, campaignData);
        message.success('캠페인이 수정되었습니다');
      } else {
        await apiClient.createCampaign(campaignData);
        message.success('캠페인이 생성되었습니다');
      }

      setModalVisible(false);
      loadCampaigns();
    } catch (error) {
      message.error('캠페인 저장에 실패했습니다');
    }
  };

  const handleROICalculation = async () => {
    try {
      const values = await roiForm.validateFields();
      const result = await apiClient.calculateROI(values);
      setRoiResult(result);
    } catch (error) {
      message.error('ROI 계산에 실패했습니다');
    }
  };

  // 통계 계산
  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'ACTIVE').length,
    total_budget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    total_roi: campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length
      : 0,
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '캠페인명',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const colors: any = {
          REACTIVATION: 'orange',
          ONBOARDING: 'blue',
          LOYALTY: 'purple',
          RETENTION: 'red',
          GROWTH: 'green',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: '대상 세그먼트',
      dataIndex: 'target_segment',
      key: 'target_segment',
      width: 180,
      ellipsis: true,
    },
    {
      title: '기간',
      key: 'period',
      width: 200,
      render: (_: any, record: any) => `${record.start_date} ~ ${record.end_date}`,
    },
    {
      title: '예산',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (budget: number) => `${(budget / 10000).toLocaleString()}만원`,
      sorter: (a: any, b: any) => a.budget - b.budget,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: 'ACTIVE', value: 'ACTIVE' },
        { text: 'COMPLETED', value: 'COMPLETED' },
        { text: 'PLANNED', value: 'PLANNED' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string) => {
        const colors: any = {
          ACTIVE: 'green',
          COMPLETED: 'default',
          PLANNED: 'blue',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: '대상 고객',
      dataIndex: 'target_customers',
      key: 'target_customers',
      width: 110,
      render: (n: number) => n.toLocaleString(),
    },
    {
      title: '도달',
      dataIndex: 'reached_customers',
      key: 'reached_customers',
      width: 100,
      render: (n: number) => n.toLocaleString(),
    },
    {
      title: '전환',
      dataIndex: 'converted_customers',
      key: 'converted_customers',
      width: 100,
      render: (n: number) => n.toLocaleString(),
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      width: 100,
      render: (roi: number) => (
        <Tag color={roi > 2 ? 'green' : roi > 1 ? 'blue' : 'red'}>
          {roi > 0 ? `${roi.toFixed(2)}x` : '-'}
        </Tag>
      ),
      sorter: (a: any, b: any) => a.roi - b.roi,
    },
    {
      title: '액션',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            수정
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        <RocketOutlined /> 캠페인 관리
      </h1>

      {/* 통계 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="전체 캠페인" value={stats.total} suffix="개" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="진행 중"
              value={stats.active}
              suffix="개"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 예산"
              value={stats.total_budget / 100000000}
              suffix="억원"
              precision={1}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="평균 ROI"
              value={stats.total_roi}
              suffix="x"
              precision={2}
              valueStyle={{ color: stats.total_roi > 2 ? '#3f8600' : '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 액션 버튼 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            캠페인 생성
          </Button>
          <Button icon={<CalculatorOutlined />} onClick={() => setRoiModalVisible(true)}>
            ROI 계산기
          </Button>
        </Space>
      </Card>

      {/* 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={campaigns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1800 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `전체 ${total}개`,
          }}
        />
      </Card>

      {/* 캠페인 생성/수정 모달 */}
      <Modal
        title={editingCampaign ? '캠페인 수정' : '캠페인 생성'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="캠페인명" rules={[{ required: true }]}>
            <Input placeholder="예: 휴면 고객 Win-back (3월)" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="캠페인 유형" rules={[{ required: true }]}>
                <Select placeholder="유형 선택">
                  <Option value="REACTIVATION">REACTIVATION (재활성화)</Option>
                  <Option value="ONBOARDING">ONBOARDING (온보딩)</Option>
                  <Option value="LOYALTY">LOYALTY (충성도)</Option>
                  <Option value="RETENTION">RETENTION (리텐션)</Option>
                  <Option value="GROWTH">GROWTH (성장)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="target_segment" label="대상 세그먼트" rules={[{ required: true }]}>
                <Input placeholder="예: 휴면 위험군 (Cluster 3)" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dates" label="캠페인 기간" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="budget" label="예산 (원)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1000000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="target_customers" label="대상 고객 수" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="상태" rules={[{ required: true }]}>
            <Select>
              <Option value="PLANNED">PLANNED (예정)</Option>
              <Option value="ACTIVE">ACTIVE (진행 중)</Option>
              <Option value="COMPLETED">COMPLETED (완료)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ROI 계산기 모달 */}
      <Modal
        title={<span><CalculatorOutlined /> ROI 계산기</span>}
        open={roiModalVisible}
        onOk={handleROICalculation}
        onCancel={() => {
          setRoiModalVisible(false);
          setRoiResult(null);
        }}
        width={600}
        okText="계산"
        cancelText="닫기"
      >
        <Form form={roiForm} layout="vertical">
          <Form.Item
            name="campaign_budget"
            label="캠페인 예산 (원)"
            rules={[{ required: true }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000000}
              placeholder="50000000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item
            name="target_customers"
            label="대상 고객 수"
            rules={[{ required: true }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="100000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item
            name="expected_conversion_rate"
            label="예상 전환율 (%)"
            rules={[{ required: true }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.1}
              placeholder="15"
            />
          </Form.Item>
          <Form.Item
            name="avg_customer_ltv"
            label="고객 평균 LTV (원)"
            rules={[{ required: true }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100000}
              placeholder="5000000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
        </Form>

        {roiResult && (
          <Card title="계산 결과" style={{ marginTop: 16 }} size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="예상 전환 고객"
                  value={roiResult.output.expected_conversions}
                  suffix="명"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="예상 매출"
                  value={roiResult.output.expected_revenue / 100000000}
                  suffix="억원"
                  precision={2}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="ROI"
                  value={roiResult.output.roi}
                  suffix="x"
                  precision={2}
                  valueStyle={{
                    color: roiResult.output.roi > 1 ? '#3f8600' : '#cf1322',
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="ROI 퍼센트"
                  value={roiResult.output.roi_percentage}
                  suffix="%"
                  precision={1}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="손익분기 전환 수"
                  value={roiResult.output.break_even_conversions}
                  suffix="명"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="손익분기 전환율"
                  value={roiResult.output.break_even_rate}
                  suffix="%"
                  precision={2}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Tag
                color={
                  roiResult.recommendation === '추천'
                    ? 'green'
                    : roiResult.recommendation === '재검토 필요'
                    ? 'orange'
                    : 'red'
                }
                style={{ fontSize: 16, padding: '4px 12px' }}
              >
                {roiResult.recommendation}
              </Tag>
            </div>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default Campaigns;
