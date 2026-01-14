# Vercel 배포 가이드

## 🚀 Vercel에 IBK 프로젝트 배포하기

### 1단계: Vercel 계정 준비
1. https://vercel.com 접속
2. GitHub 계정으로 로그인
3. "Add New Project" 클릭

### 2단계: GitHub 저장소 연결
1. "Import Git Repository" 선택
2. `everyholiday1230/ibk` 저장소 선택
3. "Import" 클릭

### 3단계: 프로젝트 설정
**Root Directory**: `frontend`로 설정  
**Framework Preset**: `Vite` 선택  
**Build Command**: `npm run build`  
**Output Directory**: `dist`  
**Install Command**: `npm install`

### 4단계: 환경 변수 (선택 사항)
- `VITE_API_URL`: 백엔드 API URL (현재는 불필요)

### 5단계: 배포
"Deploy" 버튼 클릭!

### 배포 완료 후
- 자동으로 `https://ibk-XXXX.vercel.app` 같은 URL 생성됨
- 이 URL을 팀원들에게 공유!

## ✅ 배포 후 작동 확인
- ✅ Dashboard 차트 및 통계
- ✅ Customer List 테이블
- ✅ Analytics Cluster 분석
- ✅ 모든 Mock 데이터 시각화

## ⚠️ 알려진 제한 사항
- ❌ 실시간 API 호출 (Backend 없음)
- ❌ 데이터베이스 연동 (Mock 데이터만)

## 📞 문제 발생 시
- Vercel 빌드 로그 확인
- GitHub Issues에 문의
- 또는 저에게 다시 요청

---

**예상 배포 시간**: 5-10분  
**예상 URL**: `https://ibk-churn.vercel.app` (예시)
