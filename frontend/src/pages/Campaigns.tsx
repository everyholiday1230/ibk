import React, { useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { PlusOutlined, SendOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Campaign {
  key: string;
  campaign_id: string;
  name: string;
  type: string;
  target_segment: string;
  target_count: number;
  status: string;
  start_date: string;
  end_date: string;
  response_rate: number;
  conversion_rate: number;
}

const Campaigns: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const campaignData: Campaign[] = [
    {
      key: '1',
      campaign_id: 'CP-2026-001',
      name: 'At-Risk 고객 긴급 쿠폰',
      type: '쿠폰',
      target_segment: 'At-Risk (이탈 위험 90+)',
      target_count: 35000,
      status: '진행중',
      start_date: '2026-01-10',
      end_date: '2026-01-31',
      response_rate: 32.5,
      conversion_rate: 18.2
    },
    {
      key: '2',
      campaign_id: 'CP-2026-002',
      name: 'Decline 고객 맞춤 혜택',
      type: '푸시 알림',
      target_segment: 'Decline (사용 감소)',
      target_count: 85000,
      status: '진행중',
      start_date: '2026-01-05',
      end_date: '2026-02-05',
      response_rate: 28.3,
      conversion_rate: 15.7
    },
    {
      key: '3',
      campaign_id: 'CP-2025-099',
      name: '신규 고객 활성화',
      type: '캠페인',
      target_segment: 'Onboarding',
      target_count: 120000,
      status: '완료',
      start_date: '2025-12-01',
      end_date: '2025-12-31',
      response_rate: 45.2,
      conversion_rate: 25.8
    },
    {
      key: '4',
      campaign_id: 'CP-2025-098',
      name: 'VIP 고객 감사 이벤트',
      type: '이메일',
      target_segment: 'Maturity (고가치)',
      target_count: 50000,
      status: '완료',
      start_date: '2025-11-15',
      end_date: '2025-12-15',
      response_rate: 52.0,
      conversion_rate: 32.5
    },
    {
      key: '5',
      campaign_id: 'CP-2026-003',
      name: 'Win-back 특별 프로모션',
      type: '쿠폰',
      target_segment: 'At-Risk + Decline',
      target_count: 95000,
      status: '예정',
      start_date: '2026-02-01',
      end_date: '2026-02-28',
      response_rate: 0,
      conversion_rate: 0
    },
  ];

  const columns: ColumnsType<Campaign> = [
    {
      title: '캠페인 ID',
      dataIndex: 'campaign_id',
      key: 'campaign_id',
      width: 120,
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
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '쿠폰': 'red',
          '푸시 알림': 'blue',
          '캠페인': 'purple',
          '이메일': 'green'
        };
        return <Tag color={colorMap[type]}>{type}</Tag>;
      },
    },
    {
      title: '타겟 세그먼트',
      dataIndex: 'target_segment',
      key: 'target_segment',
      width: 180,
    },
    {
      title: '타겟 수',
      dataIndex: 'target_count',
      key: 'target_count',
      width: 100,
      render: (count: number) => `${(count / 1000).toFixed(0)}K`,
      sorter: (a, b) => b.target_count - a.target_count,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '진행중': 'processing',
          '완료': 'success',
          '예정': 'default'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
      filters: [
        { text: '진행중', value: '진행중' },
        { text: '완료', value: '완료' },
        { text: '예정', value: '예정' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '기간',
      key: 'period',
      width: 200,
      render: (_, record) => `${record.start_date} ~ ${record.end_date}`,
    },
    {
      title: '반응률',
      dataIndex: 'response_rate',
      key: 'response_rate',
      width: 100,
      render: (rate: number) => rate > 0 ? `${rate.toFixed(1)}%` : '-',
      sorter: (a, b) => b.response_rate - a.response_rate,
    },
    {
      title: '전환율',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      width: 100,
      render: (rate: number) => rate > 0 ? `${rate.toFixed(1)}%` : '-',
      sorter: (a, b) => b.conversion_rate - a.conversion_rate,
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => handleDelete(record)}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      console.log('New Campaign:', values);
      message.success('캠페인이 생성되었습니다!');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleEdit = (record: Campaign) => {
    console.log('Edit campaign:', record);
    message.info(`${record.name} 수정 화면으로 이동합니다.`);
  };

  const handleDelete = (record: Campaign) => {
    Modal.confirm({
      title: '캠페인 삭제',
      content: `"${record.name}" 캠페인을 삭제하시겠습니까?`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: () => {
        message.success('캠페인이 삭제되었습니다.');
      },
    });
  };

  return (
    <div>
      <Card
        title="캠페인 관리"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showModal}
          >
            신규 캠페인 생성
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={campaignData}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `전체 ${total}개`,
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 신규 캠페인 생성 모달 */}
      <Modal
        title="신규 캠페인 생성"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={700}
        okText="생성"
        cancelText="취소"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: '쿠폰',
            target_segment: 'at_risk'
          }}
        >
          <Form.Item
            name="name"
            label="캠페인명"
            rules={[{ required: true, message: '캠페인명을 입력하세요.' }]}
          >
            <Input placeholder="예: At-Risk 고객 긴급 쿠폰" />
          </Form.Item>

          <Form.Item
            name="type"
            label="캠페인 유형"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="쿠폰">쿠폰</Select.Option>
              <Select.Option value="푸시 알림">푸시 알림</Select.Option>
              <Select.Option value="캠페인">캠페인</Select.Option>
              <Select.Option value="이메일">이메일</Select.Option>
              <Select.Option value="SMS">SMS</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="target_segment"
            label="타겟 세그먼트"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="at_risk">At-Risk (이탈 위험 90+)</Select.Option>
              <Select.Option value="decline">Decline (사용 감소)</Select.Option>
              <Select.Option value="onboarding">Onboarding (신규 고객)</Select.Option>
              <Select.Option value="maturity">Maturity (성숙 고객)</Select.Option>
              <Select.Option value="growth">Growth (성장 고객)</Select.Option>
              <Select.Option value="custom">커스텀 타겟팅</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="period"
            label="캠페인 기간"
            rules={[{ required: true, message: '캠페인 기간을 선택하세요.' }]}
          >
            <RangePicker 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="캠페인 설명"
          >
            <TextArea 
              rows={4} 
              placeholder="캠페인 목적, 혜택 내용, 기대 효과 등을 작성하세요."
            />
          </Form.Item>

          <Form.Item
            name="coupon_amount"
            label="쿠폰 금액 (원)"
            tooltip="쿠폰 유형인 경우 필수"
          >
            <Input type="number" placeholder="예: 50000" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Campaigns;
