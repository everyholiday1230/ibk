// Vercel 배포용 환경 변수 예시
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
export const IS_PRODUCTION = import.meta.env.PROD;

// Mock 데이터 사용 여부 (API 없을 때 자동으로 Mock 사용)
export const USE_MOCK_DATA = !API_BASE_URL || API_BASE_URL.includes('localhost');
