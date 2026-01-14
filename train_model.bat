@echo off
chcp 65001 > nul
echo ============================================================
echo IBK 카드 고객 이탈 예측 AI 모델 학습
echo (주)범온누리 이노베이션
echo ============================================================
echo.

REM 가상환경 활성화
if exist venv\Scripts\activate.bat (
    echo [1/5] 가상환경 활성화...
    call venv\Scripts\activate.bat
) else (
    echo [ERROR] 가상환경이 없습니다. setup.bat을 먼저 실행하세요.
    pause
    exit /b 1
)

REM 의존성 확인
echo [2/5] 의존성 확인 및 설치...
pip install -r backend\requirements.txt --quiet

REM 데이터 생성 (이미 있으면 스킵)
if not exist data\synthetic\customers.csv (
    echo [3/5] 합성 데이터 생성 중... (최초 1회, 약 10초 소요)
    python scripts\generate_synthetic_data.py --customers 10000 --output data\synthetic
) else (
    echo [3/5] 데이터 이미 존재 - 스킵
)

REM 모델 학습
echo [4/5] AI 모델 학습 시작... (약 2-3분 소요)
echo        - XGBoost, LightGBM, Random Forest 앙상블
echo        - 100+ Feature Engineering
echo        - SHAP 설명력 분석
echo.
python ml\train_model.py --data-dir data\synthetic --output-dir ml\models

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [5/5] ✅ 학습 완료!
    echo.
    echo 📁 학습된 모델 위치:
    echo    - ml\models\churn_model_latest.pkl
    echo.
    echo 💡 다음 단계:
    echo    1. start_backend.bat 실행 (백엔드 서버 시작)
    echo    2. start_frontend.bat 실행 (프론트엔드 시작)
    echo    3. http://localhost:3000 접속
    echo.
) else (
    echo.
    echo [ERROR] 학습 실패
    echo 로그를 확인하세요.
)

echo ============================================================
pause
