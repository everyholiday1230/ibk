"""
예측 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Prediction"])


class PredictRequest(BaseModel):
    """예측 요청"""
    customer_id: str
    features: Optional[Dict] = None


class PredictResponse(BaseModel):
    """예측 응답"""
    customer_id: str
    churn_probability: float
    risk_level: str
    risk_score: int
    lifecycle_stage: str
    recommended_actions: List[str]
    confidence: float


@router.post("/predict", response_model=PredictResponse)
async def predict_churn(request: PredictRequest) -> PredictResponse:
    """단일 고객 이탈 예측"""
    
    # Mock prediction - 실제 환경에서는 ML 모델 호출
    churn_prob = np.random.beta(2, 5)  # 0-1 사이 확률
    risk_score = int(churn_prob * 100)
    
    # Risk level
    if risk_score >= 90:
        risk_level = "CRITICAL"
        actions = [
            "VIP 전담 상담원 배정 (24시간 내)",
            "특별 혜택 패키지 제공 (연회비 면제 + 포인트 2배)",
            "경쟁사 전환 방지 긴급 프로모션"
        ]
    elif risk_score >= 70:
        risk_level = "HIGH"
        actions = [
            "맞춤형 혜택 제안 (주 이용 업종 기반)",
            "Win-back 캠페인 참여 유도",
            "고객 상담 전화 (72시간 내)"
        ]
    elif risk_score >= 50:
        risk_level = "MEDIUM"
        actions = [
            "이용 활성화 프로모션 (쿠폰 발송)",
            "신규 혜택 안내 푸시 알림",
            "월간 리포트 발송"
        ]
    else:
        risk_level = "LOW"
        actions = [
            "정기 고객 만족도 조사",
            "신규 서비스 안내"
        ]
    
    # Lifecycle stage (mock)
    lifecycle_stages = ["onboarding", "growth", "maturity", "decline", "at_risk"]
    if risk_score >= 80:
        lifecycle = "at_risk"
    elif risk_score >= 60:
        lifecycle = "decline"
    else:
        lifecycle = np.random.choice(["onboarding", "growth", "maturity"])
    
    return PredictResponse(
        customer_id=request.customer_id,
        churn_probability=round(churn_prob, 4),
        risk_level=risk_level,
        risk_score=risk_score,
        lifecycle_stage=lifecycle,
        recommended_actions=actions,
        confidence=round(0.85 + np.random.random() * 0.10, 3)
    )


@router.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)) -> Dict:
    """배치 예측 (CSV 파일)"""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="CSV 파일만 지원됩니다")
    
    # Mock response
    return {
        "status": "processing",
        "job_id": f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "total_customers": 1000,
        "estimated_time_seconds": 120,
        "message": "배치 예측이 시작되었습니다. 완료 시 알림을 받으실 수 있습니다."
    }


@router.get("/explain/{customer_id}")
async def explain_prediction(customer_id: str) -> Dict:
    """SHAP 기반 예측 설명"""
    
    # Mock SHAP values
    features = [
        "days_since_last_txn",
        "recent_3m_amount",
        "decline_rate",
        "category_diversity",
        "competitor_signal",
        "days_to_first_transaction",
        "loyalty_score",
        "monthly_avg_amount",
        "benefit_utilization",
        "complaint_history"
    ]
    
    shap_values = np.random.randn(len(features)) * 0.1
    shap_values[0] = 0.35  # days_since_last_txn (가장 중요)
    shap_values[1] = -0.25  # recent_3m_amount
    shap_values[2] = 0.18   # decline_rate
    
    return {
        "customer_id": customer_id,
        "base_value": 0.126,  # 평균 이탈률
        "prediction": 0.78,
        "shap_values": [
            {
                "feature": features[i],
                "feature_name_kr": {
                    "days_since_last_txn": "최근 거래일",
                    "recent_3m_amount": "최근 3개월 사용액",
                    "decline_rate": "감소율",
                    "category_diversity": "업종 다양성",
                    "competitor_signal": "경쟁사 전환 징후",
                    "days_to_first_transaction": "첫 거래까지 일수",
                    "loyalty_score": "충성도 점수",
                    "monthly_avg_amount": "월 평균 사용액",
                    "benefit_utilization": "혜택 사용률",
                    "complaint_history": "불만 이력"
                }[features[i]],
                "value": round(shap_values[i], 4),
                "feature_value": round(np.random.random() * 100, 2),
                "impact": "양" if shap_values[i] > 0 else "음"
            }
            for i in range(len(features))
        ]
    }


@router.get("/features/importance")
async def get_feature_importance() -> Dict:
    """Feature 중요도"""
    
    features = [
        {"name": "days_since_last_txn", "name_kr": "최근 거래일", "importance": 0.185, "rank": 1},
        {"name": "recent_3m_amount", "name_kr": "최근 3개월 사용액", "importance": 0.142, "rank": 2},
        {"name": "decline_rate", "name_kr": "감소율", "importance": 0.128, "rank": 3},
        {"name": "category_diversity", "name_kr": "업종 다양성", "importance": 0.095, "rank": 4},
        {"name": "competitor_signal", "name_kr": "경쟁사 전환 징후", "importance": 0.087, "rank": 5},
        {"name": "loyalty_score", "name_kr": "충성도 점수", "importance": 0.072, "rank": 6},
        {"name": "monthly_avg_amount", "name_kr": "월 평균 사용액", "importance": 0.065, "rank": 7},
        {"name": "benefit_utilization", "name_kr": "혜택 사용률", "importance": 0.058, "rank": 8},
        {"name": "complaint_history", "name_kr": "불만 이력", "importance": 0.052, "rank": 9},
        {"name": "days_to_first_transaction", "name_kr": "첫 거래까지 일수", "importance": 0.046, "rank": 10}
    ]
    
    return {
        "total_features": 100,
        "top_10": features,
        "model_type": "XGBoost + LightGBM + RandomForest Ensemble",
        "importance_method": "SHAP values (평균 절대값)"
    }


@router.get("/clusters")
async def get_clusters() -> Dict:
    """고객 군집 분석 결과"""
    
    clusters = [
        {
            "cluster_id": 0,
            "name": "안정 고객군",
            "size": 2100000,
            "percentage": 29.7,
            "avg_risk_score": 25,
            "characteristics": "장기 고객, 높은 충성도, 안정적 사용 패턴",
            "churn_rate": 3.2,
            "recommended_strategy": "정기 혜택 유지, 크로스셀 기회 탐색"
        },
        {
            "cluster_id": 1,
            "name": "성장 고객군",
            "size": 1350000,
            "percentage": 19.1,
            "avg_risk_score": 35,
            "characteristics": "신규~중기, 사용 증가 추세",
            "churn_rate": 8.5,
            "recommended_strategy": "주 결제카드 전환 유도, 혜택 다양화"
        },
        {
            "cluster_id": 2,
            "name": "가치 고객군 (VIP)",
            "size": 450000,
            "percentage": 6.4,
            "avg_risk_score": 28,
            "characteristics": "고액 사용자, 다양한 업종 이용",
            "churn_rate": 5.8,
            "recommended_strategy": "VIP 전용 혜택, 전담 상담 서비스"
        },
        {
            "cluster_id": 3,
            "name": "휴면 위험군",
            "size": 980000,
            "percentage": 13.9,
            "avg_risk_score": 72,
            "characteristics": "사용 빈도 감소, 30일+ 미사용",
            "churn_rate": 28.5,
            "recommended_strategy": "Win-back 캠페인, 맞춤형 쿠폰 발송"
        },
        {
            "cluster_id": 4,
            "name": "신규 활성화 필요군",
            "size": 750000,
            "percentage": 10.6,
            "avg_risk_score": 65,
            "characteristics": "가입 후 저활성, 첫 거래 지연",
            "churn_rate": 35.2,
            "recommended_strategy": "온보딩 강화, 첫 거래 인센티브"
        },
        {
            "cluster_id": 5,
            "name": "감소 추세군",
            "size": 850000,
            "percentage": 12.0,
            "avg_risk_score": 68,
            "characteristics": "최근 3개월 사용액 50%↓",
            "churn_rate": 32.8,
            "recommended_strategy": "원인 분석 후 맞춤 제안, 경쟁사 모니터링"
        },
        {
            "cluster_id": 6,
            "name": "경쟁사 전환 징후군",
            "size": 590000,
            "percentage": 8.3,
            "avg_risk_score": 85,
            "characteristics": "타 카드 사용 증가, 주 결제카드 변경",
            "churn_rate": 45.7,
            "recommended_strategy": "긴급 리텐션 프로그램, 특별 혜택 제공"
        }
    ]
    
    return {
        "total_clusters": 7,
        "clustering_method": "HDBSCAN (Stage1) + KMeans (Stage2)",
        "features_used": 100,
        "silhouette_score": 0.68,
        "clusters": clusters
    }
