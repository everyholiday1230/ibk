"""
IBK 카드 고객 이탈 예측 - 데이터베이스 모델
SQLAlchemy ORM Models (v2.0 업그레이드)

Copyright (c) 2024-2026 (주)범온누리 이노베이션
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Enum, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


# ===================== Enum 정의 =====================

class RiskLevel(enum.Enum):
    """위험 등급"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class LifecycleStage(enum.Enum):
    """생애주기 단계"""
    신규 = "신규"
    성장 = "성장"
    성숙 = "성숙"
    쇠퇴 = "쇠퇴"


class ActionType(enum.Enum):
    """액션 유형"""
    상담 = "상담"
    캠페인 = "캠페인"
    쿠폰 = "쿠폰"
    혜택 = "혜택"
    알림 = "알림"


class ActionStatus(enum.Enum):
    """액션 상태"""
    진행중 = "진행중"
    완료 = "완료"
    실패 = "실패"
    대기 = "대기"


class ActionResult(enum.Enum):
    """액션 결과"""
    성공 = "성공"
    실패 = "실패"
    부분성공 = "부분성공"
    미응답 = "미응답"
    보류 = "보류"


class CampaignStatus(enum.Enum):
    """캠페인 상태"""
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"


class ABTestStatus(enum.Enum):
    """A/B 테스트 상태"""
    준비중 = "준비중"
    진행중 = "진행중"
    완료 = "완료"
    분석중 = "분석중"


# ===================== 기본 모델 =====================

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
    risk_score = Column(Integer)  # 0-100
    last_prediction_date = Column(DateTime)
    
    # 관계
    transactions = relationship("Transaction", back_populates="customer")
    actions = relationship("CustomerAction", back_populates="customer")
    retention_records = relationship("RetentionRecord", back_populates="customer")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_customer_risk', 'risk_level', 'churn_probability'),
        Index('idx_customer_lifecycle', 'lifecycle_stage'),
    )


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


# ===================== 이탈 방지 효과 추적 =====================

class RetentionRecord(Base):
    """이탈 방지 효과 추적 테이블"""
    __tablename__ = "retention_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=False, index=True)
    
    # 상담/액션 전 상태
    action_id = Column(Integer, ForeignKey("customer_actions.action_id"), nullable=True)
    before_risk_score = Column(Integer)  # 0-100
    before_churn_prob = Column(Float)
    before_monthly_amount = Column(Integer)  # 월 사용액
    
    # 상담/액션 정보
    action_type = Column(String(50))  # 상담, 캠페인, 쿠폰 등
    action_date = Column(DateTime, nullable=False, index=True)
    action_details = Column(JSON)  # 상담 내용, 캠페인 정보 등
    
    # 측정 기간
    measurement_start_date = Column(DateTime)  # 측정 시작일 (액션 후)
    measurement_end_date = Column(DateTime)    # 측정 종료일 (30/60/90일 후)
    measurement_period_days = Column(Integer, default=30)  # 측정 기간 (일)
    
    # 액션 후 상태 (측정 결과)
    after_risk_score = Column(Integer)
    after_churn_prob = Column(Float)
    after_monthly_amount = Column(Integer)
    
    # 이탈 여부
    has_churned = Column(Boolean, default=False)  # 측정 기간 내 이탈 여부
    churn_date = Column(DateTime, nullable=True)  # 이탈 일자 (이탈한 경우)
    
    # 효과 계산
    risk_reduction = Column(Float)  # 위험도 감소량 (before - after)
    amount_change_rate = Column(Float)  # 사용액 변화율 ((after-before)/before*100)
    is_retention_success = Column(Boolean)  # 이탈 방지 성공 여부
    
    # 메타데이터
    calculated_at = Column(DateTime)  # 효과 계산 시점
    notes = Column(Text)
    
    # 관계
    customer = relationship("Customer", back_populates="retention_records")
    action = relationship("CustomerAction")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_retention_action_date', 'action_date'),
        Index('idx_retention_measurement', 'measurement_end_date', 'is_retention_success'),
    )


# ===================== 캠페인 및 A/B 테스트 =====================

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
    status = Column(String(20), default='PLANNED')  # 'PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED'
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
    
    # A/B 테스트 연결
    ab_test_id = Column(Integer, ForeignKey("ab_tests.id"), nullable=True)
    ab_test_group = Column(String(10), nullable=True)  # 'A' or 'B'
    
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계
    ab_test = relationship("ABTest", back_populates="campaigns")


class ABTest(Base):
    """A/B 테스트 테이블"""
    __tablename__ = "ab_tests"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # 테스트 기간
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    status = Column(String(20), default='준비중')  # '준비중', '진행중', '완료', '분석중'
    
    # 테스트 설계
    hypothesis = Column(Text)  # 가설
    target_segment = Column(String(100))  # 대상 세그먼트
    sample_size = Column(Integer)  # 전체 샘플 크기
    split_ratio = Column(Float, default=0.5)  # A:B 비율 (0.5 = 50:50)
    
    # A 그룹 설정
    group_a_name = Column(String(100), default='통제군')
    group_a_description = Column(Text)
    group_a_size = Column(Integer, default=0)
    
    # B 그룹 설정
    group_b_name = Column(String(100), default='실험군')
    group_b_description = Column(Text)
    group_b_size = Column(Integer, default=0)
    
    # 측정 지표
    primary_metric = Column(String(100))  # 주요 지표 (예: 이탈률, 전환율)
    secondary_metrics = Column(JSON)  # 부차적 지표들
    
    # 결과
    group_a_metric_value = Column(Float)  # A그룹 주요 지표 값
    group_b_metric_value = Column(Float)  # B그룹 주요 지표 값
    lift = Column(Float)  # 상승률 ((B-A)/A * 100)
    p_value = Column(Float)  # 통계적 유의성 (p-value)
    is_significant = Column(Boolean)  # 통계적으로 유의미한지
    confidence_level = Column(Float, default=0.95)  # 신뢰수준
    
    # 결론
    winner = Column(String(10))  # 'A', 'B', 'NONE'
    conclusion = Column(Text)
    recommendations = Column(Text)
    
    # 메타데이터
    created_by = Column(String(100))
    analyzed_by = Column(String(100))
    analyzed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계
    campaigns = relationship("Campaign", back_populates="ab_test")
    participants = relationship("ABTestParticipant", back_populates="ab_test")


class ABTestParticipant(Base):
    """A/B 테스트 참가자"""
    __tablename__ = "ab_test_participants"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ab_test_id = Column(Integer, ForeignKey("ab_tests.id"), nullable=False, index=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=False, index=True)
    
    group = Column(String(10), nullable=False)  # 'A' or 'B'
    assigned_at = Column(DateTime, default=datetime.utcnow)
    
    # 참가자 초기 상태
    initial_risk_score = Column(Integer)
    initial_churn_prob = Column(Float)
    
    # 결과 측정
    final_risk_score = Column(Integer)
    final_churn_prob = Column(Float)
    has_churned = Column(Boolean, default=False)
    has_converted = Column(Boolean, default=False)  # 목표 행동 수행 여부
    
    # 메타데이터
    measured_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계
    ab_test = relationship("ABTest", back_populates="participants")
    
    __table_args__ = (
        Index('idx_abtest_participant', 'ab_test_id', 'group'),
    )


# ===================== 보고서 =====================

class Report(Base):
    """보고서 테이블"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    report_type = Column(String(50), nullable=False)  # 'daily', 'weekly', 'monthly', 'quarterly', 'custom'
    report_name = Column(String(200), nullable=False)
    
    # 보고서 기간
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # 보고서 내용 (JSON)
    summary = Column(JSON)  # 요약 통계
    details = Column(JSON)  # 상세 데이터
    charts_data = Column(JSON)  # 차트용 데이터
    
    # 파일 정보
    file_path = Column(String(500))  # PDF 저장 경로
    file_size = Column(Integer)  # 파일 크기 (bytes)
    
    # 메타데이터
    generated_by = Column(String(100))
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # 상태
    status = Column(String(20), default='생성중')  # '생성중', '완료', '실패'
    error_message = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_report_period', 'period_start', 'period_end'),
        Index('idx_report_type', 'report_type', 'generated_at'),
    )


# ===================== 모델 성능 및 로그 =====================

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
