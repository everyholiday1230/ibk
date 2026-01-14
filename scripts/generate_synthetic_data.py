"""
IBK 카드고객 합성 데이터 생성기
- IBK 공시자료 기반 현실적인 데이터 생성
- 707만명 규모의 분포 재현
- 이탈률 12.9% 반영
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IBKSyntheticDataGenerator:
    """
    IBK 카드고객 합성 데이터 생성기
    """
    
    def __init__(self, seed=42):
        np.random.seed(seed)
        self.reference_date = datetime(2026, 1, 14)
        
    def generate(self, n_customers=100000, n_months=36):
        """
        합성 데이터 생성
        
        Args:
            n_customers: 생성할 고객 수
            n_months: 거래 데이터 기간 (개월)
        """
        logger.info(f"🚀 Generating synthetic data for {n_customers:,} customers...")
        
        # 1. 고객 기본 정보
        customers_df = self._generate_customers(n_customers)
        
        # 2. 거래 데이터
        transactions_df = self._generate_transactions(customers_df, n_months)
        
        # 3. 이탈 레이블
        customers_df = self._assign_churn_labels(customers_df, transactions_df)
        
        logger.info(f"✅ Generated:")
        logger.info(f"   - Customers: {len(customers_df):,}")
        logger.info(f"   - Transactions: {len(transactions_df):,}")
        logger.info(f"   - Churn rate: {customers_df['churned'].mean():.2%}")
        
        return customers_df, transactions_df
    
    def _generate_customers(self, n):
        """고객 기본 정보 생성"""
        logger.info("📊 Generating customer profiles...")
        
        # 가입일 분포 (최근 3년)
        join_dates = pd.date_range(
            end=self.reference_date - timedelta(days=30),
            periods=n,
            freq='h'
        )
        np.random.shuffle(join_dates.values)
        
        # 연령 분포 (20-70세, 정규분포)
        ages = np.clip(np.random.normal(42, 12, n), 20, 70).astype(int)
        
        # 지역 분포
        regions = np.random.choice(
            ['서울', '경기', '인천', '부산', '대구', '기타'],
            size=n,
            p=[0.25, 0.30, 0.10, 0.10, 0.08, 0.17]
        )
        
        # 고객 유형 (개인/기업)
        customer_types = np.random.choice(
            ['개인', '기업'],
            size=n,
            p=[0.83, 0.17]  # IBK 실제 비율
        )
        
        # 신용등급 (1-10등급)
        credit_grades = np.random.choice(
            range(1, 11),
            size=n,
            p=[0.05, 0.08, 0.12, 0.15, 0.18, 0.15, 0.12, 0.08, 0.05, 0.02]
        )
        
        customers = pd.DataFrame({
            'customer_id': range(n),
            'join_date': join_dates,
            'age': ages,
            'region': regions,
            'customer_type': customer_types,
            'credit_grade': credit_grades
        })
        
        return customers
    
    def _generate_transactions(self, customers_df, n_months):
        """거래 데이터 생성"""
        logger.info("💳 Generating transactions...")
        
        transactions = []
        
        for _, customer in customers_df.iterrows():
            customer_id = customer['customer_id']
            join_date = pd.to_datetime(customer['join_date'])
            
            # 고객별 활동 수준 (0: 휴면, 1: 매우 활발)
            activity_level = np.random.beta(2, 5)  # 대부분 낮은 활동
            
            # 월평균 거래 건수
            monthly_txn_count = int(np.random.poisson(activity_level * 20))
            
            if monthly_txn_count == 0:
                continue
            
            # 거래일 생성
            max_days = min((self.reference_date - join_date).days, n_months * 30)
            if max_days <= 0:
                continue
            
            txn_dates = [
                join_date + timedelta(days=int(np.random.uniform(0, max_days)))
                for _ in range(monthly_txn_count * n_months // 12)
            ]
            
            # 거래 금액 및 업종
            categories = ['식음료', '쇼핑', '교통', '문화', '의료', '기타']
            category_prefs = np.random.dirichlet([1] * len(categories))
            
            for txn_date in txn_dates:
                amount = int(np.random.lognormal(10, 1.2))  # 로그정규분포
                category = np.random.choice(categories, p=category_prefs)
                
                transactions.append({
                    'customer_id': customer_id,
                    'transaction_date': txn_date,
                    'amount': amount,
                    'category': category,
                    'channel': np.random.choice(['online', 'offline'], p=[0.6, 0.4]),
                    'merchant_size': np.random.choice(['large', 'small'], p=[0.4, 0.6])
                })
        
        return pd.DataFrame(transactions)
    
    def _assign_churn_labels(self, customers_df, transactions_df):
        """이탈 레이블 할당"""
        logger.info("🏷️  Assigning churn labels...")
        
        customers_df['churned'] = 0
        
        for idx, customer in customers_df.iterrows():
            customer_id = customer['customer_id']
            txns = transactions_df[transactions_df['customer_id'] == customer_id]
            
            if len(txns) == 0:
                # 거래 없음 = 즉시 이탈
                customers_df.at[idx, 'churned'] = 1
                continue
            
            # 최근 90일 이내 거래 확인
            recent_txns = txns[
                pd.to_datetime(txns['transaction_date']) >= 
                (self.reference_date - timedelta(days=90))
            ]
            
            # 이탈 조건
            if len(recent_txns) == 0:
                # 90일 이상 미사용
                customers_df.at[idx, 'churned'] = 1
            elif len(txns) < 5:
                # 거래 건수 매우 적음
                if np.random.random() < 0.3:
                    customers_df.at[idx, 'churned'] = 1
        
        # 목표 이탈률 12.9% 맞추기
        current_churn_rate = customers_df['churned'].mean()
        target_churn_rate = 0.129
        
        if current_churn_rate < target_churn_rate:
            # 추가 이탈 고객 선정
            non_churned = customers_df[customers_df['churned'] == 0].index
            n_additional = int((target_churn_rate - current_churn_rate) * len(customers_df))
            additional_churned = np.random.choice(non_churned, size=n_additional, replace=False)
            customers_df.loc[additional_churned, 'churned'] = 1
        
        return customers_df
    
    def save(self, customers_df, transactions_df, output_dir='data/synthetic'):
        """데이터 저장"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        customers_file = output_path / 'customers.csv'
        transactions_file = output_path / 'transactions.csv'
        
        customers_df.to_csv(customers_file, index=False)
        transactions_df.to_csv(transactions_file, index=False)
        
        logger.info(f"💾 Saved:")
        logger.info(f"   - {customers_file}")
        logger.info(f"   - {transactions_file}")
        
        return customers_file, transactions_file


def main():
    parser = argparse.ArgumentParser(description='Generate IBK synthetic data')
    parser.add_argument('--customers', type=int, default=100000, help='Number of customers')
    parser.add_argument('--months', type=int, default=36, help='Transaction period in months')
    parser.add_argument('--output', type=str, default='data/synthetic', help='Output directory')
    
    args = parser.parse_args()
    
    generator = IBKSyntheticDataGenerator()
    customers_df, transactions_df = generator.generate(args.customers, args.months)
    generator.save(customers_df, transactions_df, args.output)
    
    logger.info("✅ Synthetic data generation completed!")


if __name__ == "__main__":
    main()
