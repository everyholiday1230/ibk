"""
IBK 카드 고객 이탈 예측 - 데이터베이스 모델
SQLAlchemy ORM Models

Copyright (c) 2024 (주)범온누리 이노베이션
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Customer(Base):
    """고객 테이블"""
    __tablename__ = "customers"
    
    customer_id = Column(String(50), primary_key=True, index=True)
    join_date = Column(DateTime, nullable=False)
    age = Column(Integer)
    gender = Column(String(1))
    region = Column(String(50))
    occupation = Column(String(50))
    annual_income = Column(Integer)
    credit_score = Column(Integer)
    card_type = Column(String(20))
    lifecycle_stage = Column(String(20))
    churned = Column(Integer, default=0)
    
    # 예측 결과
    churn_probability = Column(Float)
    risk_level = Column(String(20))
    last_prediction_date = Column(DateTime)
    
    # 관계
    transactions = relationship("Transaction", back_populates="customer")
    actions = relationship("CustomerAction", back_populates="customer")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Transaction(Base):
    """거래 테이블"""
    __tablename__ = "transactions"
    
    transaction_id = Column(String(50), primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=False, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    category = Column(String(50))
    payment_method = Column(String(20))
    merchant_type = Column(String(20))
    
    # 관계
    customer = relationship("Customer", back_populates="transactions")
    
    created_at = Column(DateTime, default=datetime.utcnow)


class CustomerAction(Base):
    """고객 액션 이력 (상담, 캠페인 등)"""
    __tablename__ = "customer_actions"
    
    action_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=False, index=True)
    
    action_type = Column(String(50), nullable=False)  # '상담', '캠페인', '쿠폰', '혜택'
    action_date = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # 상담 정보
    counselor = Column(String(100))  # 담당자
    channel = Column(String(50))  # '전화', '이메일', '문자', 'APP'
    
    # 액션 내용
    action_title = Column(String(200))
    action_description = Column(Text)
    
    # 결과
    status = Column(String(20), default='진행중')  # '진행중', '완료', '실패'
    result = Column(String(50))  # '긍정', '부정', '중립', '미응답'
    notes = Column(Text)
    
    # 효과 측정
    before_churn_prob = Column(Float)
    after_churn_prob = Column(Float)
    is_successful = Column(Boolean, default=False)
    
    # 관계
    customer = relationship("Customer", back_populates="actions")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Campaign(Base):
    """캠페인 테이블"""
    __tablename__ = "campaigns"
    
    campaign_id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_name = Column(String(200), nullable=False)
    campaign_type = Column(String(50))  # '이탈방지', '활성화', 'VIP', '프로모션'
    
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    
    target_segment = Column(String(100))  # '고위험', 'Cluster 3', 'VIP' 등
    target_customer_count = Column(Integer, default=0)
    
    # 캠페인 내용
    description = Column(Text)
    offer_type = Column(String(50))  # '쿠폰', '포인트', '할인', '혜택'
    offer_value = Column(String(100))
    
    # 실행 현황
    status = Column(String(20), default='준비중')  # '준비중', '진행중', '완료', '중단'
    sent_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    converted_count = Column(Integer, default=0)
    
    # 효과 측정
    engagement_rate = Column(Float, default=0.0)
    conversion_rate = Column(Float, default=0.0)
    roi = Column(Float, default=0.0)
    cost = Column(Integer, default=0)
    revenue = Column(Integer, default=0)
    
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ModelPerformance(Base):
    """모델 성능 모니터링"""
    __tablename__ = "model_performance"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_version = Column(String(50), nullable=False)
    
    # 성능 지표
    auc = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    
    # 데이터 통계
    train_size = Column(Integer)
    test_size = Column(Integer)
    churn_rate = Column(Float)
    
    # Feature Importance (JSON)
    feature_importance = Column(JSON)
    
    # 메타데이터
    training_date = Column(DateTime, default=datetime.utcnow)
    training_duration_seconds = Column(Integer)
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class SystemLog(Base):
    """시스템 로그"""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    log_level = Column(String(20), nullable=False, index=True)  # 'INFO', 'WARNING', 'ERROR'
    log_type = Column(String(50), index=True)  # 'prediction', 'api', 'scheduler', 'email'
    
    message = Column(Text, nullable=False)
    details = Column(JSON)
    
    user_id = Column(String(100))
    ip_address = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
