import React, { useState } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Progress } from 'antd';
import { SearchOutlined, FilterOutlined, ExportOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface Customer {
  key: string;
  customer_id: string;
  name: string;
  age: number;
  gender: string;
  region: string;
  lifecycle: string;
  churn_score: number;
  last_txn_days: number;
  monthly_amount: number;
  join_date: string;
}

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 샘플 고객 데이터
  const customerData: Customer[] = Array.from({ length: 50 }, (_, i) => ({
    key: `${i}`,
    customer_id: `C${String(i + 10000).padStart(7, '0')}`,
    name: `고객${i + 1}`,
    age: 25 + Math.floor(Math.random() * 40),
    gender: Math.random() > 0.5 ? '남' : '여',
    region: ['서울', '경기', '부산', '대구', '인천'][Math.floor(Math.random() * 5)],
    lifecycle: ['onboarding', 'growth', 'maturity', 'decline', 'at_risk'][Math.floor(Math.random() * 5)],
    churn_score: Math.floor(Math.random() * 100),
    last_txn_days: Math.floor(Math.random() * 90),
    monthly_amount: Math.floor(Math.random() * 5000000) + 100000,
    join_date: `202${Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  }));

  const lifecycleConfig: Record<string, { color: string; label: string }> = {
    onboarding: { color: 'green', label: 'Onboarding' },
    growth: { color: 'blue', label: 'Growth' },
    maturity: { color: 'purple', label: 'Maturity' },
    decline: { color: 'orange', label: 'Decline' },
    at_risk: { color: 'red', label: 'At-Risk' }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: '고객 ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
      fixed: 'left',
      width: 120,
      render: (text: string) => (
        <a onClick={() => navigate(`/customers/${text}`)}>{text}</a>
      ),
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '나이',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: '성별',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      filters: [
        { text: '남', value: '남' },
        { text: '여', value: '여' },
      ],
      onFilter: (value, record) => record.gender === value,
    },
    {
      title: '지역',
      dataIndex: 'region',
      key: 'region',
      width: 100,
      filters: [
        { text: '서울', value: '서울' },
        { text: '경기', value: '경기' },
        { text: '부산', value: '부산' },
        { text: '대구', value: '대구' },
        { text: '인천', value: '인천' },
      ],
      onFilter: (value, record) => record.region === value,
    },
    {
      title: '생애주기',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 120,
      render: (lifecycle: string) => (
        <Tag color={lifecycleConfig[lifecycle]?.color}>
          {lifecycleConfig[lifecycle]?.label}
        </Tag>
      ),
      filters: [
        { text: 'Onboarding', value: 'onboarding' },
        { text: 'Growth', value: 'growth' },
        { text: 'Maturity', value: 'maturity' },
        { text: 'Decline', value: 'decline' },
        { text: 'At-Risk', value: 'at_risk' },
      ],
      onFilter: (value, record) => record.lifecycle === value,
    },
    {
      title: '이탈 위험도',
      dataIndex: 'churn_score',
      key: 'churn_score',
      width: 150,
      render: (score: number) => (
        <Space>
          <Progress
            percent={score}
            size="small"
            strokeColor={score >= 90 ? '#f5222d' : score >= 70 ? '#fa8c16' : '#52c41a'}
            showInfo={false}
            style={{ width: 80 }}
          />
          <span style={{ 
            fontWeight: score >= 70 ? 600 : 400,
            color: score >= 90 ? '#f5222d' : score >= 70 ? '#fa8c16' : '#000'
          }}>
            {score}
          </span>
        </Space>
      ),
      sorter: (a, b) => b.churn_score - a.churn_score,
    },
    {
      title: '마지막 거래',
      dataIndex: 'last_txn_days',
      key: 'last_txn_days',
      width: 120,
      render: (days: number) => `${days}일 전`,
      sorter: (a, b) => b.last_txn_days - a.last_txn_days,
    },
    {
      title: '월 평균 이용액',
      dataIndex: 'monthly_amount',
      key: 'monthly_amount',
      width: 140,
      render: (amount: number) => `${(amount / 10000).toFixed(0)}만원`,
      sorter: (a, b) => b.monthly_amount - a.monthly_amount,
    },
    {
      title: '가입일',
      dataIndex: 'join_date',
      key: 'join_date',
      width: 120,
      sorter: (a, b) => a.join_date.localeCompare(b.join_date),
    },
  ];

  const handleExport = () => {
    console.log('Export to Excel');
    // TODO: 엑셀 내보내기 구현
  };

  return (
    <div>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 검색 및 필터 */}
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Search
                placeholder="고객 ID, 이름 검색"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 300 }}
                onSearch={(value) => setSearchText(value)}
              />
              <Select
                defaultValue="all"
                style={{ width: 150 }}
                options={[
                  { value: 'all', label: '전체 고객' },
                  { value: 'high_risk', label: '고위험군 (70+)' },
                  { value: 'medium_risk', label: '중위험군 (50-69)' },
                  { value: 'low_risk', label: '저위험군 (0-49)' }
                ]}
              />
            </Space>
            
            <Button 
              icon={<ExportOutlined />} 
              onClick={handleExport}
            >
              엑셀 내보내기
            </Button>
          </Space>

          {/* 테이블 */}
          <Table
            columns={columns}
            dataSource={customerData}
            loading={loading}
            pagination={{
              total: customerData.length,
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `전체 ${total}명`,
            }}
            scroll={{ x: 1400 }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default CustomerList;
