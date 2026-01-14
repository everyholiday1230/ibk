import React from 'react';
import { Card, Form, Input, Select, Switch, Button, Divider, message, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Settings saved:', values);
    message.success('설정이 저장되었습니다!');
  };

  return (
    <div>
      <Card title="시스템 설정">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            churn_threshold_critical: 90,
            churn_threshold_high: 70,
            churn_threshold_medium: 50,
            model_version: 'v2.1',
            auto_campaign: true,
            notification_enabled: true,
            batch_prediction_time: '02:00',
            retention_days: 90,
          }}
        >
          <Divider orientation="left">이탈 위험도 임계값</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="churn_threshold_critical"
                label="CRITICAL (긴급 개입)"
                rules={[{ required: true }]}
              >
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  addonAfter="점 이상"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="churn_threshold_high"
                label="HIGH (적극 대응)"
                rules={[{ required: true }]}
              >
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  addonAfter="점 이상"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="churn_threshold_medium"
                label="MEDIUM (예방적 조치)"
                rules={[{ required: true }]}
              >
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  addonAfter="점 이상"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">모델 설정</Divider>
          
          <Form.Item
            name="model_version"
            label="사용 중인 모델 버전"
          >
            <Select>
              <Select.Option value="v2.1">v2.1 - XGBoost+LightGBM+RF Ensemble (최신)</Select.Option>
              <Select.Option value="v2.0">v2.0 - XGBoost+LightGBM Ensemble</Select.Option>
              <Select.Option value="v1.5">v1.5 - XGBoost Single</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="feature_count"
            label="사용 Feature 개수"
          >
            <Select>
              <Select.Option value="all">전체 (100+)</Select.Option>
              <Select.Option value="top50">Top 50 (SHAP 기준)</Select.Option>
              <Select.Option value="top30">Top 30 (핵심만)</Select.Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">자동화 설정</Divider>
          
          <Form.Item
            name="auto_campaign"
            label="자동 캠페인 발송"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="notification_enabled"
            label="이메일 알림"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="batch_prediction_time"
            label="배치 예측 실행 시간"
            tooltip="매일 자동으로 전체 고객 이탈 점수를 재계산하는 시간"
          >
            <Select>
              <Select.Option value="00:00">00:00 (자정)</Select.Option>
              <Select.Option value="02:00">02:00 (새벽 2시)</Select.Option>
              <Select.Option value="04:00">04:00 (새벽 4시)</Select.Option>
              <Select.Option value="06:00">06:00 (오전 6시)</Select.Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">데이터 보관 정책</Divider>
          
          <Form.Item
            name="retention_days"
            label="로그 보관 기간 (일)"
          >
            <Input 
              type="number" 
              min={30} 
              max={365} 
              addonAfter="일"
            />
          </Form.Item>

          <Form.Item
            name="backup_enabled"
            label="자동 백업"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left">API 설정</Divider>
          
          <Form.Item
            name="api_endpoint"
            label="API Endpoint"
          >
            <Input placeholder="https://api.ibk-churn.com/v1" disabled />
          </Form.Item>

          <Form.Item
            name="rate_limit"
            label="Rate Limit (요청/분)"
          >
            <Input 
              type="number" 
              placeholder="1000"
              addonAfter="요청/분"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              size="large"
            >
              설정 저장
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
