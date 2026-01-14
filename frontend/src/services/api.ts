/**
 * API 클라이언트
 * - 백엔드 API 호출 통합
 * - 에러 핸들링
 * - 타입 안정성
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 토큰이 있다면 추가
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          message.error('인증이 만료되었습니다. 다시 로그인해주세요.');
          // 로그아웃 처리
        } else if (error.response?.status === 500) {
          message.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.code === 'ECONNABORTED') {
          message.error('요청 시간이 초과되었습니다.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Dashboard APIs
  async getDashboardStats() {
    const { data } = await this.client.get('/api/dashboard/stats');
    return data;
  }

  async getUrgentAlerts() {
    const { data } = await this.client.get('/api/dashboard/alerts');
    return data;
  }

  async getRealtimeMetrics() {
    const { data } = await this.client.get('/api/dashboard/realtime');
    return data;
  }

  async getSegmentAnalysis() {
    const { data } = await this.client.get('/api/dashboard/segment-analysis');
    return data;
  }

  // Prediction APIs
  async predictChurn(customerId: string, features?: any) {
    const { data } = await this.client.post('/api/predict', {
      customer_id: customerId,
      features,
    });
    return data;
  }

  async predictBatch(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await this.client.post('/api/predict/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async explainPrediction(customerId: string) {
    const { data } = await this.client.get(`/api/explain/${customerId}`);
    return data;
  }

  async getFeatureImportance() {
    const { data } = await this.client.get('/api/features/importance');
    return data;
  }

  async getClusters() {
    const { data } = await this.client.get('/api/clusters');
    return data;
  }

  // Customer APIs
  async getCustomers(params: {
    page?: number;
    page_size?: number;
    risk_level?: string;
    lifecycle?: string;
    search?: string;
  }) {
    const { data } = await this.client.get('/api/customers', { params });
    return data;
  }

  async getCustomerDetail(customerId: string) {
    const { data } = await this.client.get(`/api/customers/${customerId}`);
    return data;
  }

  async getCustomerTransactions(customerId: string, params?: any) {
    const { data } = await this.client.get(`/api/customers/${customerId}/transactions`, { params });
    return data;
  }

  async addCustomerNote(customerId: string, note: { content: string; type: string }) {
    const { data } = await this.client.post(`/api/customers/${customerId}/note`, note);
    return data;
  }

  // Campaign APIs
  async getCampaigns() {
    const { data } = await this.client.get('/api/campaigns');
    return data;
  }

  async createCampaign(campaign: any) {
    const { data } = await this.client.post('/api/campaigns', campaign);
    return data;
  }

  async updateCampaign(campaignId: number, campaign: any) {
    const { data } = await this.client.put(`/api/campaigns/${campaignId}`, campaign);
    return data;
  }

  async deleteCampaign(campaignId: number) {
    const { data } = await this.client.delete(`/api/campaigns/${campaignId}`);
    return data;
  }

  async calculateROI(params: {
    campaign_budget: number;
    target_customers: number;
    expected_conversion_rate: number;
    avg_customer_ltv: number;
  }) {
    const { data } = await this.client.get('/api/campaigns/roi-calculator', { params });
    return data;
  }

  // Health check
  async healthCheck() {
    const { data } = await this.client.get('/health');
    return data;
  }
}

export default new ApiClient();
