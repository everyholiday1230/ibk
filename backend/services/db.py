"""
IBK 카드 고객 이탈 예측 - 데이터베이스 연결
SQLAlchemy Session 관리

Copyright (c) 2024 (주)범온누리 이노베이션
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
import logging
import os
from typing import Generator

from models.database import Base

logger = logging.getLogger(__name__)

# SQLite 사용 (최고 성능을 위한 설정)
DATABASE_URL = "sqlite:///./ibk_churn.db"

# Engine 생성 (최적화된 설정)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """데이터베이스 초기화 (테이블 생성)"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


def get_db() -> Generator[Session, None, None]:
    """
    데이터베이스 세션 의존성 (FastAPI Depends용)
    
    Usage:
        @app.get("/customers")
        def get_customers(db: Session = Depends(get_db)):
            return db.query(Customer).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    데이터베이스 세션 컨텍스트 매니저
    
    Usage:
        with get_db_context() as db:
            customers = db.query(Customer).all()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def check_db_connection() -> bool:
    """데이터베이스 연결 확인"""
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


# DB 이벤트 리스너
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """연결 시 실행"""
    logger.debug("Database connection established")


@event.listens_for(engine, "close")
def receive_close(dbapi_conn, connection_record):
    """연결 종료 시 실행"""
    logger.debug("Database connection closed")
