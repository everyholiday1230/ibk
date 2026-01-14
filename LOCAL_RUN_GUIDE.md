# 🚀 로컬 실행 가이드

## 📋 시스템 요구사항

- **Node.js**: 18.x 이상
- **Python**: 3.9 이상
- **Docker** (선택 사항): Docker Desktop 설치
- **Git**: 최신 버전

---

## 🎯 방법 1: Docker로 실행 (가장 쉬움!) ⭐

### 1단계: 저장소 클론
```bash
git clone https://github.com/everyholiday1230/ibk.git
cd ibk
```

### 2단계: 환경 변수 설정
```bash
cp .env.example .env
```

### 3단계: Docker Compose 실행
```bash
docker-compose up -d
```

### 4단계: 접속
- **Backend API**: http://localhost:8000
- **Swagger 문서**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

### 종료
```bash
docker-compose down
```

---

## 🎯 방법 2: 로컬 개발 환경 (권장!)

### Backend 실행

#### 1단계: Python 가상환경 생성
```bash
cd ibk/backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

#### 2단계: 의존성 설치
```bash
pip install -r requirements.txt
```

#### 3단계: Backend 실행
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ **Backend 실행 확인**: http://localhost:8000/docs

---

### Frontend 실행

#### 1단계: 새 터미널 열기
```bash
cd ibk/frontend
```

#### 2단계: 의존성 설치
```bash
npm install
```

#### 3단계: Frontend 실행
```bash
npm run dev
```

✅ **Frontend 실행 확인**: http://localhost:3000

---

## 🧪 테스트 실행

### Backend 테스트
```bash
cd backend
pytest tests/
```

### 데이터 생성 테스트
```bash
python scripts/generate_synthetic_data.py --samples 10000
```

---

## 🎨 주요 기능 확인

### 1. Dashboard (http://localhost:3000)
- ✅ 실시간 지표 4개
- ✅ ECharts 차트 3개
- ✅ 위험 고객 테이블

### 2. Customer List
- ✅ 50명 샘플 데이터
- ✅ 검색/필터/정렬

### 3. Customer Detail
- ✅ SHAP 설명 차트
- ✅ 거래 내역
- ✅ 권장 액션

### 4. Analytics
- ✅ 7개 Cluster 분석
- ✅ Feature 중요도
- ✅ 모델 성능

### 5. Swagger API (http://localhost:8000/docs)
- ✅ POST /predict - 이탈 예측
- ✅ GET /health - 헬스 체크
- ✅ POST /batch/predict - 배치 예측

---

## ⚠️ 문제 해결 (Troubleshooting)

### Python 패키지 설치 오류
```bash
# pip 업그레이드
pip install --upgrade pip

# 개별 설치
pip install fastapi uvicorn
pip install xgboost lightgbm scikit-learn
pip install pandas numpy shap
```

### Node.js 패키지 설치 오류
```bash
# npm 캐시 클리어
npm cache clean --force

# 재설치
rm -rf node_modules package-lock.json
npm install
```

### 포트 충돌
```bash
# Backend 포트 변경
uvicorn main:app --reload --port 8001

# Frontend 포트 변경
npm run dev -- --port 3001
```

### Docker 오류
```bash
# Docker 재시작
docker-compose down -v
docker-compose up -d --build
```

---

## 📊 성능 확인

### Backend API 응답 시간
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "C0012345"}'
```

**예상 응답 시간**: < 200ms

### Frontend 로딩 속도
- **First Contentful Paint**: < 1.5초
- **Time to Interactive**: < 3초

---

## 🎯 다음 단계

### 1. 실제 데이터 연동
```python
# backend/main.py 수정
# PostgreSQL 연결 설정
DATABASE_URL = "postgresql://user:pass@localhost:5432/ibk_db"
```

### 2. AWS 배포
```bash
# Terraform 사용
cd infrastructure/terraform
terraform init
terraform apply
```

### 3. CI/CD 파이프라인
- GitHub Actions 이미 설정됨 (`.github/workflows/ci.yml`)
- Push 시 자동 테스트 실행

---

## 📞 지원

문제가 발생하면:
1. GitHub Issues: https://github.com/everyholiday1230/ibk/issues
2. 로그 확인: `backend/logs/` 폴더
3. Docker 로그: `docker-compose logs -f`

---

## ✅ 체크리스트

실행 전 확인:
- [ ] Git 저장소 클론 완료
- [ ] Python 3.9+ 설치 확인 (`python --version`)
- [ ] Node.js 18+ 설치 확인 (`node --version`)
- [ ] Docker 실행 중 (Docker 사용 시)
- [ ] 포트 8000, 3000 사용 가능 확인

실행 후 확인:
- [ ] Backend API: http://localhost:8000/docs 접속
- [ ] Frontend: http://localhost:3000 접속
- [ ] Dashboard 차트 정상 표시
- [ ] Customer List 데이터 로딩

---

**예상 실행 시간**:
- Docker: 5-10분 (첫 실행)
- 로컬 개발 환경: 10-15분 (의존성 설치 포함)

**축하합니다! 🎉 IBK 이탈방지 AI 시스템이 로컬에서 실행되었습니다!**
