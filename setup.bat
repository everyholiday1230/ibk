@echo off
chcp 65001 > nul
echo ============================================================
echo IBK 카드 고객 이탈 예측 AI - 초기 설정
echo (주)범온누리 이노베이션
echo ============================================================
echo.

REM Python 버전 확인
echo [1/5] Python 버전 확인...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python이 설치되어 있지 않습니다.
    echo Python 3.11 이상을 설치하세요: https://www.python.org/
    pause
    exit /b 1
)

REM 가상환경 생성
if not exist venv (
    echo [2/5] 가상환경 생성 중...
    python -m venv venv
) else (
    echo [2/5] 가상환경 이미 존재 - 스킵
)

REM 가상환경 활성화
echo [3/5] 가상환경 활성화...
call venv\Scripts\activate.bat

REM 의존성 설치
echo [4/5] Python 패키지 설치 중... (약 2-3분 소요)
echo        XGBoost, LightGBM, FastAPI, PostgreSQL, Redis 등...
pip install --upgrade pip setuptools wheel
pip install -r backend\requirements.txt

REM 환경변수 파일 생성
if not exist .env (
    echo [5/5] 환경변수 파일 생성...
    copy .env.example .env
    echo ✓ .env 파일이 생성되었습니다. 필요시 수정하세요.
) else (
    echo [5/5] .env 파일 이미 존재 - 스킵
)

echo.
echo ============================================================
echo ✅ 초기 설정 완료!
echo ============================================================
echo.
echo 💡 다음 단계:
echo    1. train_model.bat 실행 (AI 모델 학습)
echo    2. start_backend.bat 실행 (백엔드 서버)
echo    3. start_frontend.bat 실행 (프론트엔드)
echo.
echo 또는 start_all.bat 실행 (전체 한번에 시작)
echo ============================================================
pause
