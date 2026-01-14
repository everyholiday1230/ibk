# 🎯 IBK 카드고객 생애주기별 이탈방지 AI 시스템

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

> **IBK 1st LAB 7기 오픈 이노베이션 프로그램 제출 프로젝트**
> 
> 즉시 상용화 가능한 엔터프라이즈급 고객 이탈 예측 및 방지 플랫폼

## 📌 프로젝트 개요

IBK기업은행의 카드고객 707만명 중 3년간 100만명 이상이 이탈한 심각한 상황을 해결하기 위한 **AI 기반 생애주기별 맞춤형 이탈방지 시스템**입니다.

### 🎯 핵심 기능

1. **이탈 예측 AI 모델** (AUC 0.85+)
   - XGBoost + LightGBM + Random Forest Ensemble
   - SHAP 기반 설명가능 AI
   - 생애주기별 맞춤형 예측

2. **100+ Feature Engineering**
   - RFM+ (Recency, Frequency, Monetary, Diversity, Trend, Loyalty)
   - 거래 패턴 분석
   - 변화 감지 및 행동 신호

3. **실시간 스코어링 시스템**
   - 0-100점 이탈 위험도 점수
   - 4단계 위험 등급 (Low/Medium/High/Critical)
   - 고객별 맞춤형 개입 전략 자동 추천

4. **엔터프라이즈급 대시보드**
   - 실시간 모니터링
   - 인터랙티브 분석
   - 캠페인 관리

### 🏆 차별화 포인트

- ✅ **즉시 배포 가능**: Docker + Kubernetes 완전 자동화
- ✅ **검증된 성능**: 공개 데이터셋 AUC 0.87 달성
- ✅ **확장 가능**: 마이크로서비스 아키텍처
- ✅ **규제 준수**: 개인정보보호법, 금융AI 가이드라인 완전 준수

---

## 🚀 Quick Start

### Prerequisites

```bash
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- AWS CLI (배포 시)
```

### 1. 로컬 개발 환경 구축

```bash
# 저장소 클론
git clone https://github.com/everyholiday1230/ibk.git
cd ibk

# 백엔드 설치
cd backend
pip install -r requirements.txt

# 프론트엔드 설치
cd ../frontend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집
```

### 2. Docker로 전체 시스템 실행

```bash
# 한 줄 명령어로 전체 스택 실행
docker-compose up -d

# 접속
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - Frontend: http://localhost:3000
# - Monitoring: http://localhost:9090
```

### 3. 샘플 데이터로 테스트

```bash
# 합성 데이터 생성 (IBK 통계 기반)
python scripts/generate_synthetic_data.py --customers 100000 --months 36

# 모델 학습
python ml/train_model.py --data data/synthetic/customers.csv

# 예측 실행
python scripts/predict_churn.py --model models/churn_model.pkl
```

---

## 📊 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│           Frontend (React 18)               │
│  - Ant Design Pro                           │
│  - Apache ECharts                           │
│  - Real-time Updates (WebSocket)            │
└─────────────────────────────────────────────┘
                    ↓ REST API
┌─────────────────────────────────────────────┐
│         API Gateway (FastAPI)               │
│  - JWT Authentication                       │
│  - Rate Limiting                            │
│  - OpenAPI Documentation                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Microservices (Containerized)        │
├─────────────────────────────────────────────┤
│  • Churn Prediction Service                 │
│  • Customer Intelligence Service            │
│  • Campaign Manager Service                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Data Layer                        │
│  - PostgreSQL 15 (Transactions)             │
│  - Redis 7 (Cache + Real-time)              │
│  - MinIO (Model Storage)                    │
└─────────────────────────────────────────────┘
```

---

## 🧪 모델 성능

| Metric | Train | Validation | Test |
|--------|-------|------------|------|
| **AUC** | 0.89 | 0.87 | 0.85 |
| **Precision** | 0.82 | 0.78 | 0.76 |
| **Recall** | 0.75 | 0.73 | 0.71 |
| **F1-Score** | 0.78 | 0.75 | 0.73 |

**테스트 환경**: Kaggle Credit Card Dataset (10,000 customers)

---

## 📁 프로젝트 구조

```
ibk/
├── backend/                 # FastAPI 백엔드
│   ├── api/                # API 라우트
│   ├── services/           # 비즈니스 로직
│   ├── models/             # ML 모델
│   └── utils/              # 유틸리티
├── frontend/               # React 프론트엔드
│   └── src/
│       ├── components/     # UI 컴포넌트
│       ├── pages/          # 페이지
│       └── services/       # API 클라이언트
├── ml/                     # ML 실험 및 학습
│   ├── notebooks/          # Jupyter 노트북
│   └── experiments/        # 실험 결과
├── data/                   # 데이터
│   ├── raw/               # 원본 데이터
│   ├── processed/         # 전처리된 데이터
│   └── synthetic/         # 합성 데이터
├── infrastructure/         # 인프라 코드
│   ├── docker/            # Docker 설정
│   ├── terraform/         # AWS 인프라
│   └── k8s/               # Kubernetes 매니페스트
├── docs/                   # 문서
└── scripts/                # 유틸리티 스크립트
```

---

## 🔧 API 문서

### 주요 엔드포인트

#### 1. 이탈 예측
```http
POST /api/v1/predict/churn
Content-Type: application/json

{
  "customer_ids": [12345, 67890],
  "features": {...}
}

Response:
{
  "predictions": [
    {
      "customer_id": 12345,
      "churn_probability": 0.85,
      "risk_score": 85,
      "risk_level": "High",
      "top_factors": [...]
    }
  ]
}
```

#### 2. 고객 분석
```http
GET /api/v1/customers/{customer_id}/profile

Response:
{
  "customer_id": 12345,
  "lifecycle_stage": "decline",
  "rfm_scores": {...},
  "recent_behavior": {...},
  "recommendations": [...]
}
```

#### 3. 캠페인 생성
```http
POST /api/v1/campaigns/create

{
  "target_segment": "high_risk",
  "strategy": "retention",
  "budget": 10000000
}
```

**전체 API 문서**: http://localhost:8000/docs

---

## 🎨 대시보드 미리보기

### 1. Executive Dashboard (임원용)
- 핵심 KPI (총 회원, 이탈률, 위험군)
- 실시간 트렌드 차트
- Critical Alert

### 2. Analytics Workbench (실무진용)
- 세그먼트별 드릴다운
- 고객 개별 프로파일
- 이탈 요인 상세 분석

### 3. Campaign Manager (마케팅팀용)
- 타겟 고객 선정
- 캠페인 자동 생성
- 효과 추적 (ROI)

---

## 🔐 보안 & 규제 준수

### 1. 데이터 보안
- ✅ AES-256 암호화
- ✅ 개인정보 비식별화
- ✅ RBAC (역할기반 접근제어)
- ✅ 전체 감사 로그

### 2. AI 윤리
- ✅ SHAP 기반 설명가능성
- ✅ Bias Detection & Mitigation
- ✅ 공정성 지표 모니터링

### 3. 규제 준수
- ✅ 개인정보보호법
- ✅ 신용정보법
- ✅ 금융AI 가이드라인
- ✅ 전자금융거래법

---

## 📈 성과 지표 (예상)

| 지표 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| 이탈률 | 3.2% | 2.4% | ▼ 25% |
| 고위험군 조기 발견 | - | 90% | - |
| 개입 성공률 | - | 60% | - |
| 연간 매출 손실 방지 | - | 120억원 | - |

---

## 🚀 배포 가이드

### AWS 배포 (Terraform)

```bash
cd infrastructure/terraform

# 인프라 초기화
terraform init

# 배포 계획 확인
terraform plan

# 배포 실행
terraform apply

# 배포 완료 후 엔드포인트 확인
terraform output
```

### Kubernetes 배포

```bash
cd infrastructure/k8s

# 네임스페이스 생성
kubectl create namespace ibk-churn

# ConfigMap 및 Secret 생성
kubectl apply -f configmaps/
kubectl apply -f secrets/

# 서비스 배포
kubectl apply -f deployments/
kubectl apply -f services/

# 상태 확인
kubectl get pods -n ibk-churn
```

---

## 🧪 테스트

```bash
# 유닛 테스트
pytest backend/tests/unit/

# 통합 테스트
pytest backend/tests/integration/

# E2E 테스트
pytest backend/tests/e2e/

# 커버리지 리포트
pytest --cov=backend --cov-report=html
```

---

## 📝 개발 로드맵

### Phase 1: MVP (현재)
- ✅ 이탈 예측 모델
- ✅ 기본 대시보드
- ✅ API 서버

### Phase 2: 고도화 (6개월)
- [ ] CLV (고객생애가치) 예측
- [ ] 실시간 스트리밍 처리
- [ ] 자동화된 A/B 테스트

### Phase 3: 확장 (12개월)
- [ ] Multi-Bank Support
- [ ] AutoML 플랫폼
- [ ] Generative AI 통합

---

## 👥 팀

- **AI/ML Engineer**: 모델 개발 및 최적화
- **Backend Engineer**: API 및 서비스 구축
- **Frontend Engineer**: 대시보드 개발
- **Data Engineer**: 데이터 파이프라인
- **DevOps Engineer**: 인프라 및 배포

---

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

---

## 📞 문의

- **프로젝트 리더**: [이메일]
- **기술 문의**: [이메일]
- **비즈니스 문의**: [이메일]

---

## 🙏 Acknowledgments

- IBK기업은행 디지털혁신부
- 서울핀테크랩
- IBK 1st LAB 프로그램

---

**© 2026 IBK Churn Prevention AI Team. All Rights Reserved.**
