"""
IBK 카드 고객 이탈 예측 - Feature Engineering
100+ 피처 생성 (RFM, 생애주기, 거래 패턴 등)

Copyright (c) 2024 (주)범온누리 이노베이션
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """피처 엔지니어링 클래스"""
    
    def __init__(self, reference_date=None):
        self.reference_date = reference_date or datetime.now()
        
    def transform(self, customers_df, transactions_df):
        """피처 생성"""
        logger.info("🔧 Feature Engineering...")
        
        # 1. 고객 기본 피처
        features = customers_df.copy()
        features['join_date'] = pd.to_datetime(features['join_date'])
        features['months_since_join'] = (self.reference_date - features['join_date']).dt.days / 30
        
        # 2. 거래 데이터 피처
        transactions_df['transaction_date'] = pd.to_datetime(transactions_df['transaction_date'])
        
        # 고객별 집계
        txn_features = self._create_transaction_features(transactions_df)
        
        # 3. RFM 피처
        rfm_features = self._create_rfm_features(transactions_df)
        
        # 4. 시계열 피처
        trend_features = self._create_trend_features(transactions_df)
        
        # 5. 카테고리별 피처
        category_features = self._create_category_features(transactions_df)
        
        # 병합
        features = features.merge(txn_features, on='customer_id', how='left')
        features = features.merge(rfm_features, on='customer_id', how='left')
        features = features.merge(trend_features, on='customer_id', how='left')
        features = features.merge(category_features, on='customer_id', how='left')
        
        # 결측치 처리
        numeric_cols = features.select_dtypes(include=[np.number]).columns
        features[numeric_cols] = features[numeric_cols].fillna(0)
        
        logger.info(f"   ✓ Total features: {features.shape[1]}")
        
        return features
    
    def _create_transaction_features(self, df):
        """거래 기본 피처"""
        features = df.groupby('customer_id').agg({
            'transaction_id': 'count',
            'amount': ['sum', 'mean', 'std', 'min', 'max'],
            'transaction_date': ['min', 'max']
        }).reset_index()
        
        features.columns = ['customer_id', 
                           'txn_count', 
                           'txn_amount_total', 
                           'txn_amount_avg', 
                           'txn_amount_std',
                           'txn_amount_min',
                           'txn_amount_max',
                           'first_txn_date',
                           'last_txn_date']
        
        # 활동 기간
        features['days_active'] = (features['last_txn_date'] - features['first_txn_date']).dt.days
        features['txn_frequency'] = features['txn_count'] / (features['days_active'] + 1)
        
        # 최근 거래일로부터 경과 일수
        features['days_since_last_txn'] = (self.reference_date - features['last_txn_date']).dt.days
        
        # 날짜 컬럼 제거
        features = features.drop(columns=['first_txn_date', 'last_txn_date'])
        
        return features
    
    def _create_rfm_features(self, df):
        """RFM (Recency, Frequency, Monetary) 분석"""
        # 최근 거래일
        recency = df.groupby('customer_id')['transaction_date'].max().reset_index()
        recency['recency_days'] = (self.reference_date - recency['transaction_date']).dt.days
        
        # 거래 빈도
        frequency = df.groupby('customer_id').size().reset_index(name='frequency')
        
        # 거래 금액
        monetary = df.groupby('customer_id')['amount'].sum().reset_index()
        monetary.columns = ['customer_id', 'monetary']
        
        # 병합
        rfm = recency[['customer_id', 'recency_days']]
        rfm = rfm.merge(frequency, on='customer_id')
        rfm = rfm.merge(monetary, on='customer_id')
        
        # RFM 점수 (1~5)
        rfm['r_score'] = pd.qcut(rfm['recency_days'], 5, labels=[5,4,3,2,1], duplicates='drop')
        rfm['f_score'] = pd.qcut(rfm['frequency'], 5, labels=[1,2,3,4,5], duplicates='drop')
        rfm['m_score'] = pd.qcut(rfm['monetary'], 5, labels=[1,2,3,4,5], duplicates='drop')
        
        rfm['r_score'] = rfm['r_score'].astype(float)
        rfm['f_score'] = rfm['f_score'].astype(float)
        rfm['m_score'] = rfm['m_score'].astype(float)
        
        rfm['rfm_score'] = rfm['r_score'] + rfm['f_score'] + rfm['m_score']
        
        return rfm
    
    def _create_trend_features(self, df):
        """시계열 추세 피처"""
        # 최근 3개월, 6개월 거래
        cutoff_3m = self.reference_date - timedelta(days=90)
        cutoff_6m = self.reference_date - timedelta(days=180)
        
        df_3m = df[df['transaction_date'] >= cutoff_3m]
        df_6m = df[df['transaction_date'] >= cutoff_6m]
        
        # 3개월 피처
        txn_3m = df_3m.groupby('customer_id').agg({
            'transaction_id': 'count',
            'amount': 'sum'
        }).reset_index()
        txn_3m.columns = ['customer_id', 'txn_count_3m', 'txn_amount_3m']
        
        # 6개월 피처
        txn_6m = df_6m.groupby('customer_id').agg({
            'transaction_id': 'count',
            'amount': 'sum'
        }).reset_index()
        txn_6m.columns = ['customer_id', 'txn_count_6m', 'txn_amount_6m']
        
        # 병합
        trend = txn_3m.merge(txn_6m, on='customer_id', how='outer').fillna(0)
        
        # 추세 계산 (최근 3개월 vs 이전 3개월)
        trend['txn_count_trend'] = trend['txn_count_3m'] / (trend['txn_count_6m'] - trend['txn_count_3m'] + 1)
        trend['txn_amount_trend'] = trend['txn_amount_3m'] / (trend['txn_amount_6m'] - trend['txn_amount_3m'] + 1)
        
        return trend
    
    def _create_category_features(self, df):
        """카테고리별 피처"""
        # 카테고리별 거래 비율
        category_pivot = df.pivot_table(
            index='customer_id',
            columns='category',
            values='amount',
            aggfunc='sum',
            fill_value=0
        ).reset_index()
        
        # 컬럼명 변경
        category_pivot.columns = ['customer_id'] + [f'amount_{col}' for col in category_pivot.columns[1:]]
        
        # 비율 계산
        amount_cols = [col for col in category_pivot.columns if col.startswith('amount_')]
        total_amount = category_pivot[amount_cols].sum(axis=1)
        
        for col in amount_cols:
            ratio_col = col.replace('amount_', 'ratio_')
            category_pivot[ratio_col] = category_pivot[col] / (total_amount + 1)
        
        # 결제 방법 피처
        payment_pivot = df.pivot_table(
            index='customer_id',
            columns='payment_method',
            values='transaction_id',
            aggfunc='count',
            fill_value=0
        ).reset_index()
        
        payment_pivot.columns = ['customer_id'] + [f'payment_{col}' for col in payment_pivot.columns[1:]]
        
        # 병합
        features = category_pivot.merge(payment_pivot, on='customer_id', how='outer').fillna(0)
        
        return features


def main():
    """테스트용"""
    # 데이터 로드
    customers_df = pd.read_csv('data/synthetic/customers.csv')
    transactions_df = pd.read_csv('data/synthetic/transactions.csv')
    
    # 피처 생성
    engineer = FeatureEngineer()
    features_df = engineer.transform(customers_df, transactions_df)
    
    print(f"\n✅ Features created: {features_df.shape}")
    print(f"\n📊 Feature columns:")
    print(features_df.columns.tolist())
    
    # 저장
    features_df.to_csv('data/processed/features.csv', index=False)
    print(f"\n💾 Saved to: data/processed/features.csv")


if __name__ == "__main__":
    main()
