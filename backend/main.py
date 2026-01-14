"""
IBK 카드 고객 이탈 예측 API - Main Application
실제 ML 모델 로딩 및 전체 시스템 통합

Copyright (c) 2024 (주)범온누리 이노베이션
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path

# Routers
from api.routes import predict, dashboard, campaigns, customers

# Services
from services.db import init_db, check_db_connection
from services.cache import is_redis_available, get_cache_stats
from services.scheduler import start_scheduler, stop_scheduler
from models.churn_predictor import ChurnPredictor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 전역 모델 인스턴스
ml_model: ChurnPredictor = None


def load_ml_model():
    """ML 모델 로딩"""
    global ml_model
    
    try:
        model_path = os.getenv("MODEL_PATH", "../ml/models/churn_model_latest.pkl")
        
        # 절대 경로로 변환
        if not os.path.isabs(model_path):
            model_path = os.path.join(os.path.dirname(__file__), model_path)
        
        if not os.path.exists(model_path):
            logger.warning(f"⚠️ Model file not found: {model_path}")
            logger.warning("   Please run: train_model.bat")
            logger.warning("   Starting with mock predictions...")
            return None
        
        logger.info(f"📦 Loading model from: {model_path}")
        ml_model = ChurnPredictor.load_from_file(model_path)
        logger.info("✅ ML model loaded successfully!")
        
        return ml_model
        
    except Exception as e:
        logger.error(f"❌ Failed to load ML model: {e}", exc_info=True)
        logger.warning("   Starting with mock predictions...")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    logger.info("="*60)
    logger.info("🚀 Starting IBK Churn Prevention API")
    logger.info("   (주)범온누리 이노베이션")
    logger.info("="*60)
    
    # 1. 데이터베이스 초기화
    logger.info("\n[1/5] Initializing database...")
    try:
        init_db()
        if check_db_connection():
            logger.info("   ✅ Database connected")
        else:
            logger.warning("   ⚠️ Database not available (using mock data)")
    except Exception as e:
        logger.warning(f"   ⚠️ Database init failed: {e}")
    
    # 2. Redis 캐싱 확인
    logger.info("\n[2/5] Checking Redis cache...")
    if is_redis_available():
        stats = get_cache_stats()
        logger.info(f"   ✅ Redis connected - {stats.get('total_keys', 0)} keys")
    else:
        logger.warning("   ⚠️ Redis not available (caching disabled)")
    
    # 3. ML 모델 로딩
    logger.info("\n[3/5] Loading ML models...")
    model = load_ml_model()
    if model:
        logger.info("   ✅ ML model ready")
        # 모델을 app.state에 저장
        app.state.ml_model = model
    else:
        logger.warning("   ⚠️ ML model not loaded")
        app.state.ml_model = None
    
    # 4. 스케줄러 시작 (자동 리포트)
    logger.info("\n[4/5] Starting scheduler...")
    if os.getenv("ENABLE_SCHEDULER", "true").lower() == "true":
        try:
            start_scheduler()
            logger.info("   ✅ Scheduler started (daily & weekly reports)")
        except Exception as e:
            logger.warning(f"   ⚠️ Scheduler failed: {e}")
    else:
        logger.info("   ⏸️ Scheduler disabled (set ENABLE_SCHEDULER=true to enable)")
    
    # 5. 시스템 정보
    logger.info("\n[5/5] System information:")
    logger.info(f"   📍 API Docs: http://localhost:8000/docs")
    logger.info(f"   🔍 Health: http://localhost:8000/health")
    logger.info(f"   🗄️ Database: {'Connected' if check_db_connection() else 'Disconnected'}")
    logger.info(f"   💾 Redis: {'Connected' if is_redis_available() else 'Disconnected'}")
    logger.info(f"   🤖 ML Model: {'Loaded' if model else 'Mock Mode'}")
    
    logger.info("\n" + "="*60)
    logger.info("✅ API READY!")
    logger.info("="*60 + "\n")
    
    yield
    
    # Shutdown
    logger.info("\n👋 Shutting down...")
    try:
        stop_scheduler()
    except:
        pass
    logger.info("Goodbye!")


# FastAPI 앱 생성
app = FastAPI(
    title="IBK 카드 고객 이탈 예측 API",
    description="""
    AI 기반 카드 고객 이탈 예측 및 방지 시스템
    
    **주요 기능:**
    - 실시간 이탈 예측 (XGBoost, LightGBM, Random Forest 앙상블)
    - SHAP 기반 설명 가능한 AI
    - 생애주기별 맞춤 분석
    - 자동 일일/주간 리포트
    - 캠페인 효과 측정
    
    **개발:** (주)범온누리 이노베이션
    """,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 포함
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(campaigns.router, prefix="/api", tags=["Campaigns"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])


@app.get("/", tags=["Root"])
async def root():
    """API 루트"""
    return {
        "message": "IBK 카드 고객 이탈 예측 API",
        "company": "(주)범온누리 이노베이션",
        "version": "2.0.0",
        "status": "healthy",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """헬스 체크"""
    db_connected = check_db_connection()
    redis_connected = is_redis_available()
    model_loaded = hasattr(app.state, 'ml_model') and app.state.ml_model is not None
    
    return {
        "status": "healthy",
        "api": "operational",
        "database": "connected" if db_connected else "disconnected",
        "cache": "connected" if redis_connected else "disconnected",
        "model": "loaded" if model_loaded else "not_loaded",
        "company": "(주)범온누리 이노베이션"
    }


@app.get("/api/system/info", tags=["System"])
async def system_info():
    """시스템 정보"""
    return {
        "company": "(주)범온누리 이노베이션",
        "system": "IBK 카드 고객 이탈 예측 AI",
        "version": "2.0.0",
        "ml_model": {
            "loaded": hasattr(app.state, 'ml_model') and app.state.ml_model is not None,
            "type": "XGBoost + LightGBM + Random Forest Ensemble",
            "features": "100+ engineered features",
            "explainability": "SHAP-based"
        },
        "database": {
            "connected": check_db_connection(),
            "type": "PostgreSQL / SQLite"
        },
        "cache": get_cache_stats(),
        "scheduler": {
            "enabled": os.getenv("ENABLE_SCHEDULER", "true").lower() == "true",
            "jobs": ["Daily Report (08:00)", "Weekly Summary (Mon 09:00)"]
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
