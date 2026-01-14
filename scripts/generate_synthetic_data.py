"""
IBK 카드 고객 이탈 예측 - 합성 데이터 생성 (Ultra Fast)
완전 벡터화 버전

Copyright (c) 2024 (주)범온누리 이노베이션
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

np.random.seed(42)


def generate_data(n_customers=10000):
    """고객 + 거래 데이터 생성 (완전 벡터화)"""
    
    logger.info("="*60)
    logger.info("IBK 카드 합성 데이터 생성")
    logger.info("(주)범온누리 이노베이션")
    logger.info("="*60 + "\n")
    
    logger.info(f"👥 Generating {n_customers:,} customers...")
    
    # ========== 고객 데이터 ==========
    lifecycle = np.random.choice(['신규', '성장', '성숙', '쇠퇴'], n_customers, p=[0.15, 0.25, 0.40, 0.20])
    
    months_ago = np.where(lifecycle == '신규', np.random.randint(0, 6, n_customers),
                 np.where(lifecycle == '성장', np.random.randint(6, 24, n_customers),
                 np.where(lifecycle == '성숙', np.random.randint(24, 60, n_customers),
                          np.random.randint(60, 120, n_customers))))
    
    reference_date = datetime(2024, 1, 1)
    join_dates = [reference_date - timedelta(days=int(m*30)) for m in months_ago]
    
    ages = np.random.choice([25, 35, 45, 55, 65], n_customers, p=[0.15, 0.30, 0.30, 0.15, 0.10])
    ages += np.random.randint(-5, 6, n_customers)
    
    regions = np.random.choice(['서울', '경기', '부산', '기타'], n_customers, p=[0.25, 0.25, 0.15, 0.35])
    occupations = np.random.choice(['회사원', '자영업', '전문직', '기타'], n_customers, p=[0.50, 0.20, 0.15, 0.15])
    
    incomes = np.where(occupations == '전문직', np.random.normal(7000, 1500, n_customers),
              np.where(occupations == '회사원', np.random.normal(5000, 1000, n_customers),
              np.where(occupations == '자영업', np.random.normal(4000, 1500, n_customers),
                       np.random.normal(3000, 800, n_customers))))
    incomes = np.maximum(incomes, 1500)
    
    credit_scores = np.random.choice(range(1, 11), n_customers, p=[0.03, 0.07, 0.12, 0.18, 0.22, 0.18, 0.10, 0.06, 0.03, 0.01])
    card_types = np.random.choice(['일반', '골드', 'VIP'], n_customers, p=[0.70, 0.25, 0.05])
    
    churn_probs = np.where(lifecycle == '신규', 0.20,
                  np.where(lifecycle == '성장', 0.10,
                  np.where(lifecycle == '성숙', 0.08, 0.25)))
    churn_probs *= np.where(credit_scores >= 7, 1.5, 1.0)
    churn_probs *= np.where(card_types == 'VIP', 0.5, 1.0)
    churned = (np.random.random(n_customers) < churn_probs).astype(int)
    
    customers_df = pd.DataFrame({
        'customer_id': [f'C{i+1:08d}' for i in range(n_customers)],
        'join_date': [d.strftime('%Y-%m-%d') for d in join_dates],
        'age': ages,
        'gender': np.random.choice(['M', 'F'], n_customers),
        'region': regions,
        'occupation': occupations,
        'annual_income': incomes.astype(int),
        'credit_score': credit_scores,
        'card_type': card_types,
        'lifecycle_stage': lifecycle,
        'churned': churned
    })
    
    logger.info(f"   ✓ Generated {len(customers_df):,} customers")
    logger.info(f"   ✓ Churn rate: {customers_df['churned'].mean():.2%}\n")
    
    # ========== 거래 데이터 ==========
    logger.info("💳 Generating transactions...")
    
    # 고객당 평균 거래 건수 (생애주기별)
    avg_txns = np.where(lifecycle == '신규', 30,
               np.where(lifecycle == '성장', 80,
               np.where(lifecycle == '성숙', 120, 20)))
    
    avg_txns = np.where(card_types == 'VIP', avg_txns * 1.5, avg_txns).astype(int)
    avg_txns = np.where(churned == 1, avg_txns * 0.5, avg_txns).astype(int)  # 이탈 고객은 거래 적음
    
    # 각 고객의 실제 거래 건수 (포아송 분포)
    txn_counts = np.random.poisson(avg_txns)
    txn_counts = np.maximum(txn_counts, 5)  # 최소 5건
    
    total_txns = txn_counts.sum()
    logger.info(f"   ✓ Total transactions to generate: {total_txns:,}")
    
    # 고객 ID 반복
    customer_ids = np.repeat(customers_df['customer_id'].values, txn_counts)
    
    # 거래 날짜 (최근 360일 내)
    days_ago = np.random.randint(0, 360, total_txns)
    txn_dates = [reference_date - timedelta(days=int(d)) for d in days_ago]
    
    # 거래 금액 (로그 정규 분포)
    customer_incomes = np.repeat(incomes, txn_counts)
    avg_amounts = customer_incomes / 12 * 0.25
    amounts = np.random.lognormal(np.log(avg_amounts + 1), 0.6)
    amounts = np.clip(amounts, 1000, 5000000).astype(int)
    
    # 카테고리, 결제 방법
    categories = np.random.choice(['식음료', '쇼핑', '교통', '문화', '의료', '통신', '기타'],
                                  total_txns, p=[0.25, 0.30, 0.15, 0.10, 0.07, 0.05, 0.08])
    
    payment_methods = np.random.choice(['일시불', '할부', '리볼빙'], total_txns, p=[0.75, 0.20, 0.05])
    merchant_types = np.random.choice(['온라인', '오프라인'], total_txns, p=[0.40, 0.60])
    
    transactions_df = pd.DataFrame({
        'transaction_id': [f'T{i+1:010d}' for i in range(total_txns)],
        'customer_id': customer_ids,
        'transaction_date': [d.strftime('%Y-%m-%d') for d in txn_dates],
        'amount': amounts,
        'category': categories,
        'payment_method': payment_methods,
        'merchant_type': merchant_types
    })
    
    logger.info(f"   ✓ Generated {len(transactions_df):,} transactions")
    logger.info(f"   ✓ Average per customer: {len(transactions_df) / len(customers_df):.1f}\n")
    
    return customers_df, transactions_df


def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--customers', type=int, default=10000)
    parser.add_argument('--output', default='data/synthetic')
    args = parser.parse_args()
    
    # 데이터 생성
    customers_df, transactions_df = generate_data(args.customers)
    
    # 저장
    Path(args.output).mkdir(parents=True, exist_ok=True)
    
    customers_path = f"{args.output}/customers.csv"
    transactions_path = f"{args.output}/transactions.csv"
    
    customers_df.to_csv(customers_path, index=False, encoding='utf-8-sig')
    transactions_df.to_csv(transactions_path, index=False, encoding='utf-8-sig')
    
    logger.info("💾 Saved:")
    logger.info(f"   📄 {customers_path} ({len(customers_df):,} rows)")
    logger.info(f"   📄 {transactions_path} ({len(transactions_df):,} rows)")
    
    logger.info("\n" + "="*60)
    logger.info("✅ 합성 데이터 생성 완료!")
    logger.info("="*60)


if __name__ == "__main__":
    main()
