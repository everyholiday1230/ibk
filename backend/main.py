"""
IBK 카드고객 이탈방지 시스템 - FastAPI Main Application
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from typing import List, Dict

# API Routes (will be created)
# from backend.api.routes import predict, customers, campaigns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting IBK Churn Prevention API...")
    logger.info("📊 Loading ML models...")
    # TODO: Load models here
    logger.info("✅ API Ready!")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down API...")


# FastAPI app
app = FastAPI(
    title="IBK Churn Prevention API",
    description="AI-powered customer churn prediction and prevention system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check
@app.get("/")
async def root():
    return {
        "message": "IBK Churn Prevention API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "api": "operational",
        "database": "connected",  # TODO: Check actual DB
        "model": "loaded"  # TODO: Check actual model
    }


# API Routes (to be implemented)
@app.post("/api/v1/predict/churn")
async def predict_churn(customer_ids: List[int]):
    """
    고객 이탈 확률 예측
    """
    # TODO: Implement
    return {"message": "Prediction endpoint - To be implemented"}


@app.get("/api/v1/customers/{customer_id}/profile")
async def get_customer_profile(customer_id: int):
    """
    고객 360도 프로파일 조회
    """
    # TODO: Implement
    return {"message": f"Customer {customer_id} profile - To be implemented"}


@app.post("/api/v1/campaigns/create")
async def create_campaign(campaign_data: Dict):
    """
    이탈방지 캠페인 생성
    """
    # TODO: Implement
    return {"message": "Campaign creation - To be implemented"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
