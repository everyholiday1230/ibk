/**
 * 고객 목록 페이지
 * - 검색 및 필터 기능
 * - 페이지네이션
 * - Excel 내보내기
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Card,
  message,
  Row,
  Col,
  Statistic,
  Upload,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  UploadOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import apiClient from '../services/api';
import * as XLSX from 'xlsx';

const { Option } = Select;

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // 필터 상태 - URL 파라미터에서 초기화
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string | undefined>(
    searchParams.get('risk_level') || undefined
  );
  const [lifecycleFilter, setLifecycleFilter] = useState<string | undefined>(
    searchParams.get('lifecycle') || undefined
  );

  // 데이터 로드
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        page_size: pageSize,
      };
      
      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (riskLevelFilter) {
        params.risk_level = riskLevelFilter;
      }
      if (lifecycleFilter) {
        params.lifecycle = lifecycleFilter;
      }
      
      const data = await apiClient.getCustomers(params);
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('고객 목록 로드 실패:', error);
      message.error('고객 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText, riskLevelFilter, lifecycleFilter]);

  // 초기 로드 및 필터 변경 시 로드
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // URL 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchText) params.set('search', searchText);
    if (riskLevelFilter) params.set('risk_level', riskLevelFilter);
    if (lifecycleFilter) params.set('lifecycle', lifecycleFilter);
    setSearchParams(params, { replace: true });
  }, [searchText, riskLevelFilter, lifecycleFilter, setSearchParams]);

  // 검색 핸들러
  const handleSearch = () => {
    setPage(1);
    loadCustomers();
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchText('');
    setRiskLevelFilter(undefined);
    setLifecycleFilter(undefined);
    setPage(1);
  };

  // Excel 내보내기
  const handleExport = () => {
    if (customers.length === 0) {
      message.warning('내보낼 데이터가 없습니다');
      return;
    }

    try {
      const exportData = customers.map((c) => ({
        고객ID: c.customer_id,
        이름: c.name,
        나이: c.age,
        성별: c.gender === 'M' ? '남' : '여',
        지역: c.region,
        직업: c.occupation,
        가입일: c.join_date,
        위험도: c.risk_score,
        위험등급: c.risk_level,
        생애주기: c.lifecycle_stage,
        이탈확률: `${(c.churn_probability * 100).toFixed(1)}%`,
        월평균사용액: `${(c.monthly_avg_amount / 10000).toFixed(0)}만원`,
        예상LTV: `${(c.ltv_estimate / 10000).toFixed(0)}만원`,
        최근거래일: c.last_transaction_date,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '고객목록');
      XLSX.writeFile(wb, `IBK_고객목록_${new Date().toISOString().split('T')[0]}.xlsx`);
      message.success('Excel 파일이 다운로드되었습니다');
    } catch (error) {
      message.error('Excel 내보내기에 실패했습니다');
    }
  };

  // 배치 업로드
  const handleBatchUpload = async (file: File) => {
    try {
      setLoading(true);
      await apiClient.predictBatch(file);
      message.success('배치 예측이 시작되었습니다. 완료 시 알림을 받으실 수 있습니다.');
    } catch (error) {
      message.error('배치 업로드에 실패했습니다');
    } finally {
      setLoading(false);
    }
    return false;
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '고객 ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
      width: 120,
      fixed: 'left' as const,
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
      width: 70,
    },
    {
      title: '성별',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
      render: (gender: string) => (gender === 'M' ? '남' : '여'),
    },
    {
      title: '지역',
      dataIndex: 'region',
      key: 'region',
      width: 100,
    },
    {
      title: '직업',
      dataIndex: 'occupation',
      key: 'occupation',
      width: 100,
    },
    {
      title: '위험도',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 90,
      sorter: (a: any, b: any) => a.risk_score - b.risk_score,
      render: (score: number) => (
        <Tag color={score >= 90 ? 'red' : score >= 70 ? 'orange' : score >= 50 ? 'blue' : 'green'}>
          {score}
        </Tag>
      ),
    },
    {
      title: '위험 등급',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level: string) => {
        const colors: any = {
          CRITICAL: 'red',
          HIGH: 'orange',
          MEDIUM: 'blue',
          LOW: 'green',
        };
        return <Tag color={colors[level]}>{level}</Tag>;
      },
    },
    {
      title: '생애주기',
      dataIndex: 'lifecycle_stage',
      key: 'lifecycle_stage',
      width: 100,
      render: (stage: string) => {
        const stageNames: any = {
          onboarding: '신규',
          growth: '성장',
          maturity: '성숙',
          decline: '쇠퇴',
          at_risk: '위험',
        };
        const colors: any = {
          onboarding: 'blue',
          growth: 'cyan',
          maturity: 'green',
          decline: 'orange',
          at_risk: 'red',
        };
        return <Tag color={colors[stage]}>{stageNames[stage] || stage}</Tag>;
      },
    },
    {
      title: '이탈 확률',
      dataIndex: 'churn_probability',
      key: 'churn_probability',
      width: 100,
      sorter: (a: any, b: any) => a.churn_probability - b.churn_probability,
      render: (prob: number) => `${(prob * 100).toFixed(1)}%`,
    },
    {
      title: '월 평균 사용액',
      dataIndex: 'monthly_avg_amount',
      key: 'monthly_avg_amount',
      width: 130,
      sorter: (a: any, b: any) => a.monthly_avg_amount - b.monthly_avg_amount,
      render: (amount: number) => `${(amount / 10000).toFixed(0)}만원`,
    },
    {
      title: '예상 LTV',
      dataIndex: 'ltv_estimate',
      key: 'ltv_estimate',
      width: 120,
      sorter: (a: any, b: any) => a.ltv_estimate - b.ltv_estimate,
      render: (ltv: number) => `${(ltv / 10000).toFixed(0)}만원`,
    },
    {
      title: '최근 거래일',
      dataIndex: 'last_transaction_date',
      key: 'last_transaction_date',
      width: 120,
    },
    {
      title: '액션',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/customers/${record.customer_id}`)}
        >
          상세
        </Button>
      ),
    },
  ];

  // 통계 계산
  const avgRiskScore = customers.length > 0
    ? (customers.reduce((sum, c) => sum + (c.risk_score || 0), 0) / customers.length).toFixed(1)
    : 0;
  
  const highRiskCount = customers.filter(
    (c) => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH'
  ).length;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>고객 목록</h1>

      {/* 통계 요약 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic title="전체 고객" value={total} suffix="명" />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="현재 페이지"
              value={customers.length}
              suffix={`/ ${pageSize}명`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic title="평균 위험도" value={avgRiskScore} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="고위험 고객"
              value={highRiskCount}
              suffix="명"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 필터 & 액션 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Space size="middle" wrap>
              <Input
                placeholder="고객 ID, 지역, 직업 검색"
                prefix={<SearchOutlined />}
                style={{ width: 220 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
              <Select
                placeholder="위험 등급"
                style={{ width: 130 }}
                allowClear
                value={riskLevelFilter}
                onChange={(value) => {
                  setRiskLevelFilter(value);
                  setPage(1);
                }}
              >
                <Option value="CRITICAL">CRITICAL</Option>
                <Option value="HIGH">HIGH</Option>
                <Option value="MEDIUM">MEDIUM</Option>
                <Option value="LOW">LOW</Option>
              </Select>
              <Select
                placeholder="생애주기"
                style={{ width: 130 }}
                allowClear
                value={lifecycleFilter}
                onChange={(value) => {
                  setLifecycleFilter(value);
                  setPage(1);
                }}
              >
                <Option value="onboarding">신규</Option>
                <Option value="growth">성장</Option>
                <Option value="maturity">성숙</Option>
                <Option value="decline">쇠퇴</Option>
                <Option value="at_risk">위험</Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                검색
              </Button>
              <Button icon={<FilterOutlined />} onClick={handleResetFilters}>
                초기화
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadCustomers}>
                새로고침
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            <Space>
              <Upload beforeUpload={handleBatchUpload} showUploadList={false} accept=".csv">
                <Button icon={<UploadOutlined />}>배치 업로드</Button>
              </Upload>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                Excel 내보내기
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="customer_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `전체 ${total.toLocaleString()}명`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize);
              }
            },
          }}
          scroll={{ x: 1600 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default CustomerList;
