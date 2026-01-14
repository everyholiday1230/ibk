"""
합성 데이터를 데이터베이스에 로드
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

import pandas as pd
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from services.db import engine, SessionLocal, init_db
from models.database import Customer, Transaction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_customers(db: Session, csv_path: str):
    """고객 데이터 로드"""
    logger.info(f"📂 Loading customers from {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    customers = []
    for _, row in df.iterrows():
        customer = Customer(
            customer_id=row['customer_id'],
            join_date=datetime.strptime(row['join_date'], '%Y-%m-%d'),
            age=int(row['age']),
            gender=row['gender'],
            region=row['region'],
            occupation=row['occupation'],
            annual_income=int(row['annual_income']),
            credit_score=int(row['credit_score']),
            card_type=row['card_type'],
            lifecycle_stage=row['lifecycle_stage'],
            churned=int(row['churned'])
        )
        customers.append(customer)
    
    # 배치 삽입
    db.bulk_save_objects(customers)
    db.commit()
    
    logger.info(f"   ✓ Loaded {len(customers):,} customers")


def load_transactions(db: Session, csv_path: str, batch_size: int = 10000):
    """거래 데이터 로드 (배치 처리)"""
    logger.info(f"📂 Loading transactions from {csv_path}")
    
    # 청크로 읽기
    total_loaded = 0
    for chunk in pd.read_csv(csv_path, chunksize=batch_size):
        transactions = []
        for _, row in chunk.iterrows():
            transaction = Transaction(
                transaction_id=row['transaction_id'],
                customer_id=row['customer_id'],
                transaction_date=datetime.strptime(row['transaction_date'], '%Y-%m-%d'),
                amount=int(row['amount']),
                category=row['category'],
                payment_method=row['payment_method'],
                merchant_type=row['merchant_type']
            )
            transactions.append(transaction)
        
        db.bulk_save_objects(transactions)
        db.commit()
        
        total_loaded += len(transactions)
        logger.info(f"   ✓ Loaded {total_loaded:,} transactions...")
    
    logger.info(f"   ✓ Total loaded: {total_loaded:,} transactions")


def main():
    logger.info("="*60)
    logger.info("IBK 데이터베이스 로딩")
    logger.info("(주)범온누리 이노베이션")
    logger.info("="*60 + "\n")
    
    # 1. 데이터베이스 초기화
    logger.info("[1/3] Initializing database...")
    init_db()
    
    # 2. 고객 데이터 로드
    logger.info("\n[2/3] Loading customers...")
    db = SessionLocal()
    try:
        load_customers(db, "data/synthetic/customers.csv")
    finally:
        db.close()
    
    # 3. 거래 데이터 로드
    logger.info("\n[3/3] Loading transactions...")
    db = SessionLocal()
    try:
        load_transactions(db, "data/synthetic/transactions.csv")
    finally:
        db.close()
    
    logger.info("\n" + "="*60)
    logger.info("✅ 데이터베이스 로딩 완료!")
    logger.info("="*60)


if __name__ == "__main__":
    main()
