"""
고객 관리 API
"""

from fastapi import APIRouter, Query
from typing import List, Dict, Optional
import random
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/customers", tags=["Customers"])


def generate_mock_customer(customer_id: str) -> Dict:
    """Mock 고객 데이터 생성"""
    
    names = ["김민수", "이영희", "박철수", "최지영", "정수진", "강동욱", "윤서연", "임현우", "한미래", "송지훈"]
    occupations = ["직장인", "자영업", "전문직", "주부", "기타"]
    regions = ["서울", "경기", "부산", "대구", "인천", "광주", "대전", "울산", "기타"]
    
    risk_score = random.randint(15, 95)
    
    if risk_score >= 90:
        lifecycle = "at_risk"
        risk_level = "CRITICAL"
    elif risk_score >= 70:
        lifecycle = random.choice(["at_risk", "decline"])
        risk_level = "HIGH"
    elif risk_score >= 50:
        lifecycle = random.choice(["decline", "maturity"])
        risk_level = "MEDIUM"
    else:
        lifecycle = random.choice(["onboarding", "growth", "maturity"])
        risk_level = "LOW"
    
    return {
        "customer_id": customer_id,
        "name": random.choice(names),
        "age": random.randint(25, 65),
        "gender": random.choice(["M", "F"]),
        "region": random.choice(regions),
        "occupation": random.choice(occupations),
        "join_date": (datetime.now() - timedelta(days=random.randint(30, 1800))).strftime("%Y-%m-%d"),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "lifecycle_stage": lifecycle,
        "churn_probability": round(risk_score / 100, 3),
        "monthly_avg_amount": random.randint(200000, 5000000),
        "ltv_estimate": random.randint(3000000, 15000000),
        "last_transaction_date": (datetime.now() - timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d"),
        "transaction_count_3m": random.randint(5, 120),
        "category_diversity": round(random.uniform(0.3, 0.9), 2)
    }


@router.get("")
async def get_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = None,
    lifecycle: Optional[str] = None,
    search: Optional[str] = None
) -> Dict:
    """고객 목록 (페이지네이션)"""
    
    # Mock data
    total = 7070000
    customers = [
        generate_mock_customer(f"C{1000000 + (page-1)*page_size + i}")
        for i in range(page_size)
    ]
    
    # Filter by risk_level
    if risk_level:
        customers = [c for c in customers if c["risk_level"] == risk_level]
    
    # Filter by lifecycle
    if lifecycle:
        customers = [c for c in customers if c["lifecycle_stage"] == lifecycle]
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "customers": customers
    }


@router.get("/{customer_id}")
async def get_customer_detail(customer_id: str) -> Dict:
    """고객 상세 정보"""
    
    customer = generate_mock_customer(customer_id)
    
    # 추가 상세 정보
    customer["details"] = {
        "total_transactions_lifetime": random.randint(50, 500),
        "total_amount_lifetime": random.randint(10000000, 100000000),
        "favorite_categories": ["외식", "쇼핑", "주유"],
        "recent_complaints": random.randint(0, 3),
        "card_type": random.choice(["일반", "골드", "플래티넘"]),
        "linked_accounts": random.randint(1, 5),
        "app_usage_days": random.randint(0, 90),
        "email_open_rate": round(random.uniform(0.1, 0.8), 2),
        "sms_response_rate": round(random.uniform(0.05, 0.5), 2)
    }
    
    # 거래 이력 (최근 10건)
    customer["recent_transactions"] = [
        {
            "date": (datetime.now() - timedelta(days=i*3)).strftime("%Y-%m-%d"),
            "category": random.choice(["외식", "쇼핑", "주유", "마트", "의료", "통신"]),
            "merchant": random.choice(["스타벅스", "이마트", "GS칼텍스", "쿠팡", "올리브영", "교보문고"]),
            "amount": random.randint(5000, 150000)
        }
        for i in range(10)
    ]
    
    # 예측 이력
    customer["prediction_history"] = [
        {
            "date": (datetime.now() - timedelta(days=i*30)).strftime("%Y-%m-%d"),
            "risk_score": customer["risk_score"] - random.randint(-10, 10),
            "churn_probability": round((customer["risk_score"] - random.randint(-10, 10)) / 100, 3)
        }
        for i in range(6)
    ][::-1]
    
    return customer


@router.get("/{customer_id}/transactions")
async def get_customer_transactions(
    customer_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None
) -> List[Dict]:
    """고객 거래 내역"""
    
    transactions = [
        {
            "transaction_id": f"T{10000000 + i}",
            "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d %H:%M:%S"),
            "category": random.choice(["외식", "쇼핑", "주유", "마트", "의료", "통신", "교통", "여가"]),
            "merchant": random.choice(["스타벅스", "이마트", "GS칼텍스", "쿠팡", "올리브영", "교보문고", "CGV", "카카오택시"]),
            "amount": random.randint(3000, 200000),
            "payment_type": random.choice(["일시불", "할부"])
        }
        for i in range(100)
    ]
    
    return transactions


@router.post("/{customer_id}/note")
async def add_customer_note(customer_id: str, note: Dict) -> Dict:
    """고객 메모 추가"""
    
    return {
        "status": "success",
        "message": "메모가 추가되었습니다",
        "note_id": random.randint(1000, 9999),
        "timestamp": datetime.now().isoformat()
    }
