/**
 * 보고서 관리 페이지
 * - 월간/분기 리포트 생성 및 내보내기
 * - 대시보드 요약 보고서
 * 
 * Copyright (c) 2024-2026 (주)범온누리 이노베이션
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Button, Tag, Modal, Form, Select, DatePicker,
  Tabs, Statistic, Progress, Spin, Space, Descriptions, Typography,
  message, List, Divider, Alert
} from 'antd';
import {
  FileTextOutlined, DownloadOutlined, PlusOutlined, FilePdfOutlined,
  FileExcelOutlined, ReloadOutlined, BarChartOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CalendarOutlined, PieChartOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface Report {
  id: number;
  report_type: string;
  report_name: string;
  period_start: string;
  period_end: string;
  status: string;
  generated_at: string | null;
  file_path: string | null;
  file_size: number | null;
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentSummary, setCurrentSummary] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, summaryData] = await Promise.all([
        apiClient.getReports(),
        apiClient.getCurrentSummary(),
      ]);
      setReports(reportsData);
      setCurrentSummary(summaryData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (values: any) => {
    try {
      const payload = {
        report_type: values.report_type,
        period_start: values.dates[0].toISOString(),
        period_end: values.dates[1].toISOString(),
        format: values.format || 'pdf',
      };

      await apiClient.generateReport(payload);
      message.success('보고서 생성이 시작되었습니다.');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('보고서 생성 요청에 실패했습니다.');
    }
  };

  const handleViewDetail = async (reportId: number) => {
    try {
      const data = await apiClient.getReportDetail(reportId);
      setSelectedReport(data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('보고서 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleExport = async (reportId: number, format: string) => {
    try {
      const result = await apiClient.exportReport(reportId, format);
      if (format === 'json') {
        // JSON으로 다운로드
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${reportId}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        message.success(`${format.toUpperCase()} 파일 생성이 요청되었습니다.`);
      }
    } catch (error) {
      message.error('내보내기에 실패했습니다.');
    }
  };

  const getStatusTag = (status: string) => {
    const config: { [key: string]: { color: string; icon: React.ReactNode } } = {
      '생성중': { color: 'processing', icon: <ClockCircleOutlined /> },
      '완료': { color: 'success', icon: <CheckCircleOutlined /> },
      '실패': { color: 'error', icon: null },
    };
    const { color, icon } = config[status] || { color: 'default', icon: null };
    return <Tag color={color} icon={icon}>{status}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const colors: { [key: string]: string } = {
      'daily': 'blue',
      'weekly': 'cyan',
      'monthly': 'green',
      'quarterly': 'purple',
      'custom': 'orange',
    };
    const labels: { [key: string]: string } = {
      'daily': '일간',
      'weekly': '주간',
      'monthly': '월간',
      'quarterly': '분기',
      'custom': '맞춤',
    };
    return <Tag color={colors[type]}>{labels[type] || type}</Tag>;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      responsive: ['md'] as const,
    },
    {
      title: '유형',
      dataIndex: 'report_type',
      key: 'report_type',
      width: 80,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '보고서명',
      dataIndex: 'report_name',
      key: 'report_name',
      ellipsis: true,
      render: (name: string, record: Report) => (
        <a onClick={() => handleViewDetail(record.id)}>{name}</a>
      ),
    },
    {
      title: '기간',
      key: 'period',
      width: 180,
      responsive: ['lg'] as const,
      render: (_: any, record: Report) => (
        <Text type="secondary">
          {dayjs(record.period_start).format('YY.MM.DD')} ~{' '}
          {dayjs(record.period_end).format('YY.MM.DD')}
        </Text>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '생성일시',
      dataIndex: 'generated_at',
      key: 'generated_at',
      width: 140,
      responsive: ['lg'] as const,
      render: (date: string | null) =>
        date ? dayjs(date).format('YY-MM-DD HH:mm') : '-',
    },
    {
      title: '액션',
      key: 'action',
      width: 180,
      render: (_: any, record: Report) => (
        <Space size="small">
          <Button size="small" onClick={() => handleViewDetail(record.id)}>
            상세
          </Button>
          {record.status === '완료' && (
            <>
              <Button
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => handleExport(record.id, 'pdf')}
              />
              <Button
                size="small"
                icon={<FileExcelOutlined />}
                onClick={() => handleExport(record.id, 'excel')}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  // 현재 요약 차트
  const summaryChartOption = currentSummary ? {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '생애주기 분포',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: [
          { value: 775, name: '신규', itemStyle: { color: '#1890ff' } },
          { value: 1258, name: '성장', itemStyle: { color: '#52c41a' } },
          { value: 1968, name: '성숙', itemStyle: { color: '#faad14' } },
          { value: 999, name: '쇠퇴', itemStyle: { color: '#ff4d4f' } },
        ],
      },
    ],
  } : null;

  return (
    <div className="reports-page">
      {/* 헤더 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              border: 'none',
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={3} style={{ color: '#fff', margin: 0 }}>
                  <FileTextOutlined /> 보고서 관리
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  월간/분기 이탈방지 보고서 생성 및 내보내기
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadData}>
                    새로고침
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalVisible(true)}
                    style={{ background: '#fff', color: '#11998e' }}
                  >
                    새 보고서
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 현재 월간 요약 */}
      {currentSummary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card title={<><CalendarOutlined /> {currentSummary.period} 현황 요약</>}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title="총 고객"
                    value={currentSummary.total_customers}
                    suffix="명"
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title="이탈 위험"
                    value={currentSummary.churned_customers}
                    suffix="명"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title="이탈률"
                    value={currentSummary.churn_rate}
                    precision={2}
                    suffix="%"
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title="이탈 방지 성공률"
                    value={currentSummary.retention_success_rate}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title="AI 모델 정확도"
                    value={currentSummary.ai_model_accuracy}
                    precision={2}
                    suffix="%"
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title="매출 손실 방지"
                    value={currentSummary.monthly_saved_revenue}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 차트 & 테이블 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={<><PieChartOutlined /> 생애주기 분포</>} style={{ height: 400 }}>
            {summaryChartOption && (
              <ReactECharts option={summaryChartOption} style={{ height: 300 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="보고서 목록">
            <Table
              columns={columns}
              dataSource={reports}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 700 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 새 보고서 생성 모달 */}
      <Modal
        title={<><FileTextOutlined /> 새 보고서 생성</>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerateReport}>
          <Form.Item
            name="report_type"
            label="보고서 유형"
            rules={[{ required: true, message: '유형을 선택하세요' }]}
          >
            <Select placeholder="선택">
              <Select.Option value="daily">일간 보고서</Select.Option>
              <Select.Option value="weekly">주간 보고서</Select.Option>
              <Select.Option value="monthly">월간 보고서</Select.Option>
              <Select.Option value="quarterly">분기 보고서</Select.Option>
              <Select.Option value="custom">맞춤 보고서</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dates"
            label="보고서 기간"
            rules={[{ required: true, message: '기간을 선택하세요' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="format" label="출력 형식" initialValue="pdf">
            <Select>
              <Select.Option value="pdf">PDF</Select.Option>
              <Select.Option value="excel">Excel</Select.Option>
              <Select.Option value="json">JSON</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                보고서 생성
              </Button>
              <Button onClick={() => setModalVisible(false)}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 보고서 상세 모달 */}
      <Modal
        title={<><BarChartOutlined /> 보고서 상세</>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          <Space>
            <Button icon={<FilePdfOutlined />} onClick={() => selectedReport && handleExport(selectedReport.id, 'pdf')}>
              PDF 다운로드
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => selectedReport && handleExport(selectedReport.id, 'excel')}>
              Excel 다운로드
            </Button>
            <Button onClick={() => setDetailModalVisible(false)}>닫기</Button>
          </Space>
        }
        width={900}
      >
        {selectedReport && selectedReport.summary && (
          <>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="보고서명" span={2}>
                {selectedReport.report_name}
              </Descriptions.Item>
              <Descriptions.Item label="유형">
                {getTypeTag(selectedReport.report_type)}
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                {getStatusTag(selectedReport.status)}
              </Descriptions.Item>
              <Descriptions.Item label="기간">
                {dayjs(selectedReport.period_start).format('YYYY-MM-DD')} ~{' '}
                {dayjs(selectedReport.period_end).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="생성일시">
                {selectedReport.generated_at ? dayjs(selectedReport.generated_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>요약 통계</Divider>

            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Card size="small">
                  <Statistic
                    title="총 고객"
                    value={selectedReport.summary.overview?.total_customers}
                    suffix="명"
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Card size="small">
                  <Statistic
                    title="이탈 고객"
                    value={selectedReport.summary.overview?.churned_customers}
                    suffix="명"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Card size="small">
                  <Statistic
                    title="이탈률"
                    value={selectedReport.summary.overview?.churn_rate}
                    precision={2}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Card size="small">
                  <Statistic
                    title="방지 성공률"
                    value={selectedReport.summary.overview?.retention_success_rate}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {selectedReport.summary.key_insights && (
              <>
                <Divider>주요 인사이트</Divider>
                <List
                  size="small"
                  dataSource={selectedReport.summary.key_insights}
                  renderItem={(item: string) => (
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      {item}
                    </List.Item>
                  )}
                />
              </>
            )}

            {selectedReport.summary.recommendations && (
              <>
                <Divider>권장 조치</Divider>
                <List
                  size="small"
                  dataSource={selectedReport.summary.recommendations}
                  renderItem={(item: string) => (
                    <List.Item>
                      <BarChartOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                      {item}
                    </List.Item>
                  )}
                />
              </>
            )}

            {selectedReport.summary.ai_model && (
              <>
                <Divider>AI 모델 정보</Divider>
                <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 4 }}>
                  <Descriptions.Item label="버전">
                    {selectedReport.summary.ai_model.version}
                  </Descriptions.Item>
                  <Descriptions.Item label="AUC">
                    {selectedReport.summary.ai_model.auc}
                  </Descriptions.Item>
                  <Descriptions.Item label="Precision">
                    {selectedReport.summary.ai_model.precision}
                  </Descriptions.Item>
                  <Descriptions.Item label="Recall">
                    {selectedReport.summary.ai_model.recall}
                  </Descriptions.Item>
                  <Descriptions.Item label="앙상블" span={4}>
                    {selectedReport.summary.ai_model.ensemble}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </>
        )}
      </Modal>

      {/* 범온누리 브랜딩 */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card size="small" style={{ background: '#f5f5f5', textAlign: 'center' }}>
            <Text type="secondary">
              보고서 자동화 시스템 | (주)범온누리 이노베이션 | IBK 기업은행 이탈방지 AI 솔루션
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
