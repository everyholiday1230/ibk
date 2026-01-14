"""
캠페인 관리 API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


class Campaign(BaseModel):
    id: Optional[int] = None
    name: str
    type: str
    target_segment: str
    start_date: str
    end_date: str
    budget: int
    status: str
    target_customers: int
    reached_customers: Optional[int] = 0
    converted_customers: Optional[int] = 0
    roi: Optional[float] = 0.0


@router.get("")
async def get_campaigns() -> List[Dict]:
    """캠페인 목록"""
    
    campaigns = [
        {
            "id": 1,
            "name": "휴면 고객 Win-back (3월)",
            "type": "REACTIVATION",
            "target_segment": "휴면 위험군 (Cluster 3)",
            "start_date": "2026-03-01",
            "end_date": "2026-03-31",
            "budget": 50000000,
            "status": "COMPLETED",
            "target_customers": 98000,
            "reached_customers": 95200,
            "converted_customers": 12800,
            "roi": 3.85,
            "conversion_rate": 13.45,
            "revenue_generated": 192500000
        },
        {
            "id": 2,
            "name": "신규 고객 온보딩 강화",
            "type": "ONBOARDING",
            "target_segment": "신규 활성화 필요군 (Cluster 4)",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "budget": 120000000,
            "status": "ACTIVE",
            "target_customers": 750000,
            "reached_customers": 285000,
            "converted_customers": 92000,
            "roi": 2.15,
            "conversion_rate": 32.28,
            "revenue_generated": 258000000
        },
        {
            "id": 3,
            "name": "VIP 고객 충성도 프로그램",
            "type": "LOYALTY",
            "target_segment": "가치 고객군 (Cluster 2)",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "budget": 80000000,
            "status": "ACTIVE",
            "target_customers": 450000,
            "reached_customers": 445000,
            "converted_customers": 382000,
            "roi": 4.25,
            "conversion_rate": 85.84,
            "revenue_generated": 340000000
        },
        {
            "id": 4,
            "name": "경쟁사 전환 방지 긴급 프로모션",
            "type": "RETENTION",
            "target_segment": "경쟁사 전환 징후군 (Cluster 6)",
            "start_date": "2026-04-01",
            "end_date": "2026-06-30",
            "budget": 90000000,
            "status": "ACTIVE",
            "target_customers": 590000,
            "reached_customers": 128000,
            "converted_customers": 18500,
            "roi": 1.58,
            "conversion_rate": 14.45,
            "revenue_generated": 142200000
        },
        {
            "id": 5,
            "name": "주 결제카드 전환 유도",
            "type": "GROWTH",
            "target_segment": "성장 고객군 (Cluster 1)",
            "start_date": "2026-02-01",
            "end_date": "2026-04-30",
            "budget": 65000000,
            "status": "PLANNED",
            "target_customers": 1350000,
            "reached_customers": 0,
            "converted_customers": 0,
            "roi": 0.0,
            "conversion_rate": 0.0,
            "revenue_generated": 0
        }
    ]
    
    return campaigns


@router.post("")
async def create_campaign(campaign: Campaign) -> Dict:
    """캠페인 생성"""
    
    campaign.id = random.randint(10, 99)
    campaign.status = "PLANNED"
    campaign.reached_customers = 0
    campaign.converted_customers = 0
    campaign.roi = 0.0
    
    return {
        "status": "success",
        "message": "캠페인이 생성되었습니다",
        "campaign": campaign.model_dump()
    }


@router.put("/{campaign_id}")
async def update_campaign(campaign_id: int, campaign: Campaign) -> Dict:
    """캠페인 수정"""
    
    return {
        "status": "success",
        "message": f"캠페인 {campaign_id}이(가) 수정되었습니다",
        "campaign": campaign.model_dump()
    }


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: int) -> Dict:
    """캠페인 삭제"""
    
    return {
        "status": "success",
        "message": f"캠페인 {campaign_id}이(가) 삭제되었습니다"
    }


@router.get("/roi-calculator")
async def calculate_roi(
    campaign_budget: int,
    target_customers: int,
    expected_conversion_rate: float,
    avg_customer_ltv: int
) -> Dict:
    """ROI 계산기"""
    
    expected_conversions = int(target_customers * expected_conversion_rate / 100)
    expected_revenue = expected_conversions * avg_customer_ltv
    roi = (expected_revenue - campaign_budget) / campaign_budget
    
    return {
        "input": {
            "campaign_budget": campaign_budget,
            "target_customers": target_customers,
            "expected_conversion_rate": expected_conversion_rate,
            "avg_customer_ltv": avg_customer_ltv
        },
        "output": {
            "expected_conversions": expected_conversions,
            "expected_revenue": expected_revenue,
            "roi": round(roi, 2),
            "roi_percentage": round(roi * 100, 1),
            "break_even_conversions": int(campaign_budget / avg_customer_ltv),
            "break_even_rate": round((campaign_budget / avg_customer_ltv / target_customers) * 100, 2)
        },
        "recommendation": "추천" if roi > 1.5 else "재검토 필요" if roi > 0.5 else "비추천"
    }
