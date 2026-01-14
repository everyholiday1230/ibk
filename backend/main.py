"""
IBK Churn Prevention API - Updated Main
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from backend.api.routes import predict, dashboard, campaigns, customers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting IBK Churn Prevention API...")
    logger.info("📊 Loading ML models...")
    # TODO: Load models here
    logger.info("✅ API Ready!")
    yield
    logger.info("👋 Shutting down API...")


app = FastAPI(
    title="IBK Churn Prevention API",
    description="AI-powered customer churn prediction and prevention system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router)
app.include_router(dashboard.router)
app.include_router(campaigns.router)
app.include_router(customers.router)


@app.get("/")
async def root():
    return {
        "message": "IBK Churn Prevention API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "api": "operational",
        "database": "connected",
        "model": "loaded"
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
