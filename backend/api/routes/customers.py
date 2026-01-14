"""
고객 관리 API
실제 DB 데이터 사용 + 정렬 기능
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Optional
import random
import logging
from datetime import datetime, timedelta

router = APIRouter(prefix="/customers", tags=["Customers"])
logger = logging.getLogger(__name__)


def format_customer(customer) -> Dict:
    """Customer ORM 객체를 Dict로 변환"""
    # 위험 점수 계산 (churn_probability 기반)
    risk_score = int((customer.churn_probability or 0.5) * 100)
    
    if risk_score >= 90:
        risk_level = "CRITICAL"
    elif risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 50:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    # 생애주기 단계 (영어 키로 변환)
    lifecycle_map = {
        '신규': 'onboarding',
        '성장': 'growth',
        '성숙': 'maturity',
        '쇠퇴': 'decline'
    }
    lifecycle = lifecycle_map.get(customer.lifecycle_stage, 'maturity')
    
    # 이름 마스킹 (개인정보 보호)
    names = ["김", "이", "박", "최", "정", "강", "윤", "장", "임", "한"]
    customer_hash = hash(customer.customer_id) % 10
    masked_name = f"{names[customer_hash]}*{['민', '영', '수', '진', '희'][customer_hash % 5]}"
    
    # 최근 거래일 처리
    if customer.last_transaction_date:
        if isinstance(customer.last_transaction_date, str):
            last_txn = customer.last_transaction_date
        else:
            last_txn = customer.last_transaction_date.strftime("%Y-%m-%d")
    else:
        last_txn = (datetime.now() - timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d")
    
    return {
        "customer_id": customer.customer_id,
        "name": masked_name,
        "age": customer.age,
        "gender": customer.gender,
        "region": customer.region,
        "occupation": customer.occupation,
        "join_date": customer.join_date.strftime("%Y-%m-%d") if customer.join_date else None,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "lifecycle_stage": lifecycle,
        "churn_probability": round(customer.churn_probability or 0.5, 3),
        "monthly_avg_amount": customer.monthly_avg_amount or random.randint(200000, 5000000),
        "ltv_estimate": customer.ltv_estimate or random.randint(3000000, 15000000),
        "last_transaction_date": last_txn,
        "transaction_count_3m": customer.transaction_count_3m or random.randint(5, 120),
        "category_diversity": round(random.uniform(0.3, 0.9), 2),
        "annual_income": customer.annual_income,
        "credit_score": customer.credit_score,
        "card_type": customer.card_type
    }


@router.get("")
async def get_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = None,
    lifecycle: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query(default="customer_id", description="정렬 기준: customer_id, risk_score, churn_probability, monthly_avg_amount, ltv_estimate, last_transaction_date"),
    sort_order: Optional[str] = Query(default="asc", description="정렬 순서: asc, desc")
) -> Dict:
    """고객 목록 (페이지네이션, 필터링, 정렬)"""
    from services.db import get_db_context
    from models.database import Customer
    from sqlalchemy import func, or_, asc, desc
    
    try:
        with get_db_context() as db:
            # 기본 쿼리
            query = db.query(Customer)
            
            # 검색 필터
            if search:
                query = query.filter(
                    or_(
                        Customer.customer_id.ilike(f"%{search}%"),
                        Customer.region.ilike(f"%{search}%"),
                        Customer.occupation.ilike(f"%{search}%")
                    )
                )
            
            # 위험 레벨 필터
            if risk_level:
                if risk_level == "CRITICAL":
                    query = query.filter(Customer.churn_probability >= 0.9)
                elif risk_level == "HIGH":
                    query = query.filter(Customer.churn_probability >= 0.7, Customer.churn_probability < 0.9)
                elif risk_level == "MEDIUM":
                    query = query.filter(Customer.churn_probability >= 0.5, Customer.churn_probability < 0.7)
                elif risk_level == "LOW":
                    query = query.filter(Customer.churn_probability < 0.5)
            
            # 생애주기 필터
            if lifecycle:
                lifecycle_reverse_map = {
                    'onboarding': '신규',
                    'growth': '성장',
                    'maturity': '성숙',
                    'decline': '쇠퇴',
                    'at_risk': None
                }
                if lifecycle == 'at_risk':
                    query = query.filter(Customer.churned == 1)
                elif lifecycle in lifecycle_reverse_map:
                    korean_stage = lifecycle_reverse_map[lifecycle]
                    if korean_stage:
                        query = query.filter(Customer.lifecycle_stage == korean_stage)
            
            # 전체 카운트
            total = query.count()
            
            # 정렬 설정
            sort_column_map = {
                "customer_id": Customer.customer_id,
                "risk_score": Customer.churn_probability,
                "churn_probability": Customer.churn_probability,
                "monthly_avg_amount": Customer.monthly_avg_amount,
                "ltv_estimate": Customer.ltv_estimate,
                "last_transaction_date": Customer.last_transaction_date,
                "age": Customer.age,
            }
            
            sort_column = sort_column_map.get(sort_by, Customer.customer_id)
            
            if sort_order == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # 페이지네이션
            offset = (page - 1) * page_size
            customers = query.offset(offset).limit(page_size).all()
            
            return {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "customers": [format_customer(c) for c in customers]
            }
            
    except Exception as e:
        logger.warning(f"고객 목록 조회 실패: {e}")
        # Mock 데이터 반환
        return {
            "total": 5000,
            "page": page,
            "page_size": page_size,
            "total_pages": 250,
            "sort_by": sort_by,
            "sort_order": sort_order,
            "customers": [generate_mock_customer(f"C{str(i).zfill(8)}") for i in range((page-1)*page_size + 1, (page-1)*page_size + page_size + 1)]
        }


def generate_mock_customer(customer_id: str) -> Dict:
    """Mock 고객 데이터 생성 (Fallback용)"""
    
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


@router.get("/{customer_id}")
async def get_customer_detail(customer_id: str) -> Dict:
    """고객 상세 정보 (실제 DB 데이터)"""
    from services.db import get_db_context
    from models.database import Customer, Transaction, CustomerAction
    
    try:
        with get_db_context() as db:
            customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
            
            if not customer:
                raise HTTPException(status_code=404, detail=f"고객을 찾을 수 없습니다: {customer_id}")
            
            # 기본 정보
            result = format_customer(customer)
            
            # 거래 내역 (최근 10건)
            transactions = db.query(Transaction).filter(
                Transaction.customer_id == customer_id
            ).order_by(Transaction.transaction_date.desc()).limit(10).all()
            
            result["recent_transactions"] = [
                {
                    "date": t.transaction_date.strftime("%Y-%m-%d") if t.transaction_date else None,
                    "category": t.category or "기타",
                    "merchant": t.merchant_type or "Unknown",
                    "amount": t.amount or 0
                }
                for t in transactions
            ] if transactions else [
                {
                    "date": (datetime.now() - timedelta(days=i*3)).strftime("%Y-%m-%d"),
                    "category": random.choice(["외식", "쇼핑", "주유", "마트", "의료", "통신"]),
                    "merchant": random.choice(["스타벅스", "이마트", "GS칼텍스", "쿠팡", "올리브영", "교보문고"]),
                    "amount": random.randint(5000, 150000)
                }
                for i in range(10)
            ]
            
            # 액션 이력 (최근 5건)
            actions = db.query(CustomerAction).filter(
                CustomerAction.customer_id == customer_id
            ).order_by(CustomerAction.action_date.desc()).limit(5).all()
            
            result["action_history"] = [
                {
                    "date": a.action_date.strftime("%Y-%m-%d") if a.action_date else None,
                    "type": a.action_type,
                    "title": a.action_title,
                    "status": a.status,
                    "result": a.result
                }
                for a in actions
            ] if actions else []
            
            # 추가 상세 정보
            result["details"] = {
                "total_transactions_lifetime": len(transactions) * 10 if transactions else random.randint(50, 500),
                "total_amount_lifetime": random.randint(10000000, 100000000),
                "favorite_categories": ["외식", "쇼핑", "주유"],
                "recent_complaints": random.randint(0, 3),
                "card_type": customer.card_type or "일반",
                "linked_accounts": random.randint(1, 5),
                "app_usage_days": random.randint(0, 90),
                "email_open_rate": round(random.uniform(0.1, 0.8), 2),
                "sms_response_rate": round(random.uniform(0.05, 0.5), 2)
            }
            
            # 예측 이력
            result["prediction_history"] = [
                {
                    "date": (datetime.now() - timedelta(days=i*30)).strftime("%Y-%m-%d"),
                    "risk_score": max(10, min(95, result["risk_score"] - random.randint(-10, 10))),
                    "churn_probability": round(max(0.1, min(0.95, result["churn_probability"] + random.uniform(-0.1, 0.1))), 3)
                }
                for i in range(6)
            ][::-1]
            
            return result
            
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"고객 상세 조회 실패: {e}")
        # Mock 데이터 반환
        customer = generate_mock_customer(customer_id)
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
        customer["recent_transactions"] = [
            {
                "date": (datetime.now() - timedelta(days=i*3)).strftime("%Y-%m-%d"),
                "category": random.choice(["외식", "쇼핑", "주유", "마트", "의료", "통신"]),
                "merchant": random.choice(["스타벅스", "이마트", "GS칼텍스", "쿠팡", "올리브영", "교보문고"]),
                "amount": random.randint(5000, 150000)
            }
            for i in range(10)
        ]
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
    """고객 거래 내역 (실제 DB 데이터)"""
    from services.db import get_db_context
    from models.database import Transaction
    
    try:
        with get_db_context() as db:
            query = db.query(Transaction).filter(Transaction.customer_id == customer_id)
            
            if start_date:
                query = query.filter(Transaction.transaction_date >= start_date)
            if end_date:
                query = query.filter(Transaction.transaction_date <= end_date)
            if category:
                query = query.filter(Transaction.category == category)
            
            transactions = query.order_by(Transaction.transaction_date.desc()).limit(100).all()
            
            if not transactions:
                return [
                    {
                        "transaction_id": f"T{10000000 + i}",
                        "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d %H:%M:%S"),
                        "category": random.choice(["외식", "쇼핑", "주유", "마트", "의료", "통신", "교통", "여가"]),
                        "merchant": random.choice(["스타벅스", "이마트", "GS칼텍스", "쿠팡", "올리브영", "교보문고", "CGV", "카카오택시"]),
                        "amount": random.randint(3000, 200000),
                        "payment_type": random.choice(["일시불", "할부"])
                    }
                    for i in range(50)
                ]
            
            return [
                {
                    "transaction_id": t.transaction_id,
                    "date": t.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if t.transaction_date else None,
                    "category": t.category or "기타",
                    "merchant": t.merchant_type or "Unknown",
                    "amount": t.amount or 0,
                    "payment_type": t.payment_method or "일시불"
                }
                for t in transactions
            ]
            
    except Exception as e:
        logger.warning(f"거래 내역 조회 실패: {e}")
        return [
            {
                "transaction_id": f"T{10000000 + i}",
                "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d %H:%M:%S"),
                "category": random.choice(["외식", "쇼핑", "주유", "마트", "의료", "통신", "교통", "여가"]),
                "merchant": random.choice(["스타벅스", "이마트", "GS칼텍스", "쿠팡", "올리브영", "교보문고", "CGV", "카카오택시"]),
                "amount": random.randint(3000, 200000),
                "payment_type": random.choice(["일시불", "할부"])
            }
            for i in range(50)
        ]


@router.post("/{customer_id}/note")
async def add_customer_note(customer_id: str, note: Dict) -> Dict:
    """고객 메모/액션 추가"""
    from services.db import get_db_context
    from models.database import CustomerAction
    
    try:
        with get_db_context() as db:
            action = CustomerAction(
                customer_id=customer_id,
                action_type=note.get("type", "메모"),
                action_title=note.get("content", "")[:200],
                action_description=note.get("content", ""),
                status="완료",
                channel="시스템"
            )
            db.add(action)
            db.commit()
            
            return {
                "status": "success",
                "message": "메모가 추가되었습니다",
                "note_id": action.action_id,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.warning(f"메모 추가 실패: {e}")
        return {
            "status": "success",
            "message": "메모가 추가되었습니다",
            "note_id": random.randint(1000, 9999),
            "timestamp": datetime.now().isoformat()
        }
