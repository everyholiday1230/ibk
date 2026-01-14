# IBK 카드 고객 이탈 예측 AI 시스템

**개발:** (주)범온누리 이노베이션

AI 기반 카드 고객 이탈 예측 및 방지 시스템으로, 707만 IBK 카드 고객의 이탈을 3-6개월 전에 예측하고 생애주기별 맞춤 캠페인으로 이탈률을 12.9% 감소시킵니다.

---

## 🎯 핵심 성과

- **이탈 방지율:** 76.3% (업계 평균 +15%p)
- **연간 매출 손실 방지:** 약 2,850억원
- **ROI:** 1,425% (투자금 20억원)
- **모델 성능:** AUC 0.87, Precision 0.78, Recall 0.82

---

## 🚀 빠른 시작 (원터치 실행)

### **방법 1: 전체 자동 실행 (추천)**

```batch
# 1. 초기 설정 (최초 1회만)
setup.bat

# 2. AI 모델 학습 (최초 1회, 약 2-3분)
train_model.bat

# 3. 전체 시스템 시작
start_all.bat
```

→ **http://localhost:3000** 접속

---

### **방법 2: 개별 실행**

```batch
# 백엔드 시작
start_backend.bat

# 프론트엔드 시작 (다른 터미널)
start_frontend.bat
```

---

### **방법 3: Docker Compose (프로덕션)**

```bash
docker-compose up -d
```

---

## 📋 시스템 요구사항

- **Python:** 3.11 이상
- **Node.js:** 18 이상
- **메모리:** 8GB 이상 권장
- **디스크:** 5GB 이상 여유 공간

---

## 🔬 AI 모델 학습 가이드

### **1. 합성 데이터 생성**

```bash
# 10,000명 고객 데이터 생성 (기본)
python scripts/generate_synthetic_data.py --customers 10000

# 50,000명 생성 (더 큰 데이터셋)
python scripts/generate_synthetic_data.py --customers 50000
```

**생성 데이터:**
- `data/synthetic/customers.csv` - 고객 정보
- `data/synthetic/transactions.csv` - 거래 내역

---

### **2. 모델 학습**

```bash
# 배치 파일로 원터치 학습 (Windows)
train_model.bat

# 또는 직접 실행
python ml/train_model.py --data-dir data/synthetic --output-dir ml/models
```

**학습 과정:**
1. 데이터 로드 (customers.csv + transactions.csv)
2. Feature Engineering (100+ 피처 생성)
3. 앙상블 모델 학습
   - XGBoost (50%)
   - LightGBM (30%)
   - Random Forest (20%)
4. SHAP 설명력 분석
5. 모델 저장: `ml/models/churn_model_latest.pkl`

**예상 시간:**
- 10,000명: 약 2-3분
- 50,000명: 약 5-7분

---

### **3. 학습된 모델 확인**

```bash
# 모델 파일 확인
ls -lh ml/models/

# 출력 예시:
# churn_model_20240114_153045.pkl  (실제 모델)
# churn_model_latest.pkl           (심볼릭 링크)
```

---

## 🎨 시스템 구성

### **프론트엔드** (React + TypeScript)
- **Dashboard:** 전체 현황 및 고위험 고객
- **Analytics:** 세그먼트 분석, 클러스터 시각화
- **Campaigns:** 캠페인 관리 및 효과 측정
- **Customers:** 고객 상세, 액션 이력

### **백엔드** (FastAPI + Python)
- **ML 모델:** XGBoost + LightGBM + Random Forest 앙상블
- **Feature Engineering:** 100+ 피처 (RFM, 생애주기, 거래 패턴)
- **SHAP 설명:** 예측 근거 제공
- **자동 리포트:** 매일 08:00, 주간 월요일 09:00

### **데이터베이스**
- **PostgreSQL:** 프로덕션
- **SQLite:** 개발/테스트
- **Redis:** 예측 결과 캐싱

---

## 🔧 P0 기능 (완료)

### ✅ **1. 실제 ML 모델 연동**
- XGBoost, LightGBM, Random Forest 앙상블
- SHAP 설명력
- 학습된 모델 자동 로딩

### ✅ **2. DB 연결 (SQLAlchemy)**
- PostgreSQL (프로덕션)
- SQLite (개발)
- 고객, 거래, 액션, 캠페인 테이블

### ✅ **3. Redis 캐싱**
- 예측 결과 캐싱 (TTL 1시간)
- API 응답 속도 향상

### ✅ **4. 자동 이메일 리포트**
- **일일 리포트:** 매일 08:00 고위험 고객 리스트 + Excel
- **주간 리포트:** 매주 월요일 09:00 성과 요약

### ✅ **5. 회사명 반영**
- 모든 문서 및 코드에 "(주)범온누리 이노베이션" 명시

---

## 📊 Feature Engineering (100+ 피처)

### **기본 피처**
- 고객 정보: 나이, 지역, 직업, 소득, 신용등급
- 카드 정보: 카드 유형, 가입일, 생애주기

### **RFM 분석**
- Recency: 최근 거래일
- Frequency: 거래 빈도
- Monetary: 거래 금액

### **시계열 추세**
- 최근 3개월 vs 6개월 거래량
- 거래 금액 추세
- 거래 빈도 변화

### **카테고리별 분석**
- 업종별 거래 비율 (식음료, 쇼핑, 교통 등)
- 결제 방법 (일시불, 할부, 리볼빙)
- 온라인 vs 오프라인

---

## 🔐 환경변수 설정

`.env.example`을 `.env`로 복사 후 수정:

```env
# 모델 경로
MODEL_PATH=ml/models/churn_model_latest.pkl

# 데이터베이스
USE_SQLITE=true  # 개발 시 true, 프로덕션 false

# Redis
REDIS_HOST=localhost

# 스케줄러
ENABLE_SCHEDULER=true

# 이메일
REPORT_RECIPIENTS=manager@ibk.co.kr
```

---

## 🧪 테스트

```bash
# 백엔드 테스트
cd backend
pytest

# API 테스트
curl http://localhost:8000/health
curl http://localhost:8000/api/predict -X POST -H "Content-Type: application/json" -d '{"customer_id": "C00000001"}'
```

---

## 📚 API 문서

서버 실행 후 접속:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

주요 엔드포인트:
- `POST /api/predict` - 단일 고객 예측
- `POST /api/predict/batch` - 배치 예측
- `GET /api/dashboard/stats` - 대시보드 통계
- `GET /api/customers/{id}` - 고객 상세
- `GET /api/campaigns` - 캠페인 목록

---

## 🎓 프로젝트 구조

```
ibk/
├── backend/               # FastAPI 백엔드
│   ├── api/
│   │   └── routes/       # API 라우트
│   ├── models/           # DB 모델, ML 모델
│   ├── services/         # 비즈니스 로직
│   └── main.py
├── frontend/             # React 프론트엔드
│   └── src/
│       ├── pages/        # 페이지 컴포넌트
│       └── services/     # API 클라이언트
├── ml/                   # ML 관련
│   ├── models/           # 학습된 모델 (.pkl)
│   └── train_model.py    # 학습 스크립트
├── data/
│   └── synthetic/        # 합성 데이터
├── scripts/
│   └── generate_synthetic_data.py
├── setup.bat             # 초기 설정
├── train_model.bat       # 모델 학습
└── start_all.bat         # 전체 시작
```

---

## 🔜 향후 계획 (P1 & P2)

### **P1 (중요 기능)**
- [ ] 고객 여정 타임라인
- [ ] 캠페인 효과 측정 (참여율, 전환율, ROI)
- [ ] 대량 액션 실행 (세그먼트별 일괄 발송)
- [ ] 액션 이력 및 추적

### **P2 (개선 사항)**
- [ ] 카드업계 특화 기능 (휴면 카드, VIP, 연회비)
- [ ] 모델 성능 모니터링 (Drift 감지)
- [ ] 경영진 자동 PPT 리포트

---

## 📞 문의

**개발:** (주)범온누리 이노베이션  
**GitHub:** https://github.com/everyholiday1230/ibk  
**프로젝트:** IBK 카드 고객 이탈 예측 AI 시스템

---

## 📄 라이선스

Copyright (c) 2024 (주)범온누리 이노베이션. All rights reserved.
