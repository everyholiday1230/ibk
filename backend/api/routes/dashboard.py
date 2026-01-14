"""
대시보드 API 엔드포인트
- 실시간 통계
- 긴급 알림
- 트렌드 분석
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats() -> Dict:
    """대시보드 실시간 통계"""
    
    # Mock data - 실제 환경에서는 DB 조회
    return {
        "summary": {
            "total_customers": 7070000,
            "at_risk_customers": 890000,
            "churn_rate": 12.6,
            "prevented_this_month": 45200,
            "revenue_protected": "285억원"
        },
        "lifecycle_distribution": {
            "onboarding": 850000,
            "growth": 1200000,
            "maturity": 3500000,
            "decline": 980000,
            "at_risk": 540000
        },
        "risk_levels": {
            "critical": 125000,  # 90+
            "high": 280000,      # 70-89
            "medium": 485000,    # 50-69
            "low": 0             # <50 (not included)
        },
        "trend": {
            "labels": ["1월", "2월", "3월", "4월", "5월", "6월"],
            "churn_rate": [14.2, 13.8, 13.5, 13.1, 12.9, 12.6],
            "prevented": [38000, 41000, 43000, 44500, 45000, 45200]
        }
    }


@router.get("/alerts")
async def get_urgent_alerts() -> List[Dict]:
    """긴급 알림 목록"""
    
    return [
        {
            "id": 1,
            "customer_id": "C789012",
            "customer_name": "김*민",
            "risk_score": 95,
            "alert_type": "CRITICAL",
            "reason": "60일 이상 미사용 + 경쟁사 전환 징후",
            "ltv": "850만원",
            "recommended_action": "VIP 전담 상담 + 특별 혜택 제공",
            "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat()
        },
        {
            "id": 2,
            "customer_id": "C456789",
            "customer_name": "이*영",
            "risk_score": 92,
            "alert_type": "CRITICAL",
            "reason": "최근 3개월 사용액 85% 감소",
            "ltv": "720만원",
            "recommended_action": "긴급 Win-back 캠페인 (72시간 내)",
            "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat()
        },
        {
            "id": 3,
            "customer_id": "C234567",
            "customer_name": "박*수",
            "risk_score": 88,
            "alert_type": "HIGH",
            "reason": "주 결제카드 변경 감지",
            "ltv": "680만원",
            "recommended_action": "맞춤형 혜택 제안 (외식/쇼핑)",
            "timestamp": (datetime.now() - timedelta(minutes=30)).isoformat()
        },
        {
            "id": 4,
            "customer_id": "C901234",
            "customer_name": "최*진",
            "risk_score": 85,
            "alert_type": "HIGH",
            "reason": "거래 다양성 급감 (5→2 업종)",
            "ltv": "590만원",
            "recommended_action": "다업종 포인트 2배 프로모션",
            "timestamp": (datetime.now() - timedelta(hours=1)).isoformat()
        },
        {
            "id": 5,
            "customer_id": "C567890",
            "customer_name": "정*희",
            "risk_score": 82,
            "alert_type": "HIGH",
            "reason": "앱 접속 30일 이상 없음",
            "ltv": "510만원",
            "recommended_action": "앱 푸시 알림 + 쿠폰 발송",
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()
        }
    ]


@router.get("/realtime")
async def get_realtime_metrics() -> Dict:
    """실시간 지표 (WebSocket 대체용)"""
    
    return {
        "timestamp": datetime.now().isoformat(),
        "active_users_now": random.randint(15000, 25000),
        "predictions_today": random.randint(8000, 12000),
        "prevented_today": random.randint(180, 250),
        "campaigns_active": 12,
        "avg_response_time_ms": random.randint(45, 85)
    }


@router.get("/segment-analysis")
async def get_segment_analysis() -> Dict:
    """세그먼트별 분석"""
    
    return {
        "by_age": [
            {"age_group": "20대", "total": 950000, "at_risk": 128000, "churn_rate": 13.5},
            {"age_group": "30대", "total": 1850000, "at_risk": 240000, "churn_rate": 13.0},
            {"age_group": "40대", "total": 2100000, "at_risk": 252000, "churn_rate": 12.0},
            {"age_group": "50대", "total": 1500000, "at_risk": 180000, "churn_rate": 12.0},
            {"age_group": "60대+", "total": 670000, "at_risk": 90000, "churn_rate": 13.4}
        ],
        "by_region": [
            {"region": "서울", "total": 2400000, "at_risk": 288000, "churn_rate": 12.0},
            {"region": "경기", "total": 1950000, "at_risk": 253500, "churn_rate": 13.0},
            {"region": "부산", "total": 720000, "at_risk": 93600, "churn_rate": 13.0},
            {"region": "대구", "total": 510000, "at_risk": 66300, "churn_rate": 13.0},
            {"region": "기타", "total": 1490000, "at_risk": 189000, "churn_rate": 12.7}
        ],
        "by_occupation": [
            {"occupation": "직장인", "total": 3200000, "at_risk": 384000, "churn_rate": 12.0},
            {"occupation": "자영업", "total": 1150000, "at_risk": 149500, "churn_rate": 13.0},
            {"occupation": "전문직", "total": 980000, "at_risk": 107800, "churn_rate": 11.0},
            {"occupation": "주부", "total": 850000, "at_risk": 110500, "churn_rate": 13.0},
            {"occupation": "기타", "total": 890000, "at_risk": 138200, "churn_rate": 15.5}
        ]
    }
