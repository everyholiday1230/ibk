@echo off
chcp 65001 > nul
echo ============================================================
echo IBK 카드 고객 이탈 예측 AI 시스템 전체 시작
echo (주)범온누리 이노베이션
echo ============================================================
echo.

REM 모델 체크
if not exist ml\models\churn_model_latest.pkl (
    echo [WARNING] 학습된 모델이 없습니다.
    echo train_model.bat을 먼저 실행하세요.
    pause
    exit /b 1
)

REM 백엔드 시작
echo [1/2] 백엔드 서버 시작 중...
start "IBK Backend" cmd /k "call venv\Scripts\activate.bat && cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM 2초 대기
timeout /t 2 /nobreak > nul

REM 프론트엔드 시작
echo [2/2] 프론트엔드 시작 중...
start "IBK Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo ✅ 시스템 시작 완료!
echo ============================================================
echo.
echo 🌐 접속 URL:
echo    프론트엔드: http://localhost:3000
echo    백엔드 API: http://localhost:8000
echo    API 문서:   http://localhost:8000/docs
echo.
echo 💡 서버를 중지하려면 각 창에서 Ctrl+C를 누르세요.
echo ============================================================
