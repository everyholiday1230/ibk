"""
Feature Engineering - 100+ 특성 생성
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from scipy import stats
import logging

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """고객 이탈 예측을 위한 Feature Engineering"""
    
    def __init__(self, reference_date: datetime = None):
        self.reference_date = reference_date or datetime.now()
        
    def transform(self, customer_df: pd.DataFrame, transaction_df: pd.DataFrame) -> pd.DataFrame:
        """전체 Feature Engineering 파이프라인"""
        logger.info("🚀 Starting Feature Engineering...")
        
        rfm_features = self._generate_rfm_features(customer_df, transaction_df)
        pattern_features = self._generate_pattern_features(customer_df, transaction_df)
        lifecycle_features = self._generate_lifecycle_features(customer_df, transaction_df)
        change_features = self._generate_change_features(customer_df, transaction_df)
        
        all_features = customer_df.copy()
        for features in [rfm_features, pattern_features, lifecycle_features, change_features]:
            all_features = all_features.merge(features, on='customer_id', how='left')
        
        logger.info(f"✅ Total features: {len(all_features.columns)}")
        return all_features
    
    def _generate_rfm_features(self, customer_df: pd.DataFrame, transaction_df: pd.DataFrame):
        """RFM+ Features"""
        features = []
        
        for customer_id in customer_df['customer_id']:
            txn = transaction_df[transaction_df['customer_id'] == customer_id]
            
            if len(txn) == 0:
                features.append({
                    'customer_id': customer_id,
                    'recency_days': 9999,
                    'frequency_total': 0,
                    'monetary_total': 0,
                    'monetary_avg': 0,
                    'diversity_score': 0
                })
                continue
            
            last_txn = pd.to_datetime(txn['transaction_date']).max()
            recency_days = (self.reference_date - last_txn).days
            
            frequency_total = len(txn)
            monetary_total = txn['amount'].sum()
            monetary_avg = txn['amount'].mean()
            
            if 'category' in txn.columns:
                category_counts = txn['category'].value_counts(normalize=True)
                diversity_score = stats.entropy(category_counts)
            else:
                diversity_score = 0
            
            features.append({
                'customer_id': customer_id,
                'recency_days': recency_days,
                'frequency_total': frequency_total,
                'monetary_total': monetary_total,
                'monetary_avg': monetary_avg,
                'diversity_score': diversity_score
            })
        
        return pd.DataFrame(features)
    
    def _generate_pattern_features(self, customer_df: pd.DataFrame, transaction_df: pd.DataFrame):
        """거래 패턴 Features"""
        features = []
        
        for customer_id in customer_df['customer_id']:
            txn = transaction_df[transaction_df['customer_id'] == customer_id].copy()
            
            if len(txn) == 0:
                features.append({'customer_id': customer_id, 'weekend_ratio': 0, 'monthly_txn_avg': 0})
                continue
            
            txn['date'] = pd.to_datetime(txn['transaction_date'])
            txn['is_weekend'] = txn['date'].dt.dayofweek.isin([5, 6]).astype(int)
            
            weekend_ratio = txn['is_weekend'].mean()
            monthly_txn = txn.groupby(txn['date'].dt.to_period('M')).size()
            monthly_txn_avg = monthly_txn.mean()
            
            features.append({
                'customer_id': customer_id,
                'weekend_ratio': weekend_ratio,
                'monthly_txn_avg': monthly_txn_avg
            })
        
        return pd.DataFrame(features)
    
    def _generate_lifecycle_features(self, customer_df: pd.DataFrame, transaction_df: pd.DataFrame):
        """생애주기 Features"""
        features = []
        
        for _, customer in customer_df.iterrows():
            customer_id = customer['customer_id']
            join_date = pd.to_datetime(customer['join_date'])
            months_since_join = (self.reference_date - join_date).days / 30
            
            txn = transaction_df[transaction_df['customer_id'] == customer_id]
            
            if len(txn) == 0:
                lifecycle_stage = 'inactive'
                days_since_last_txn = 9999
            else:
                last_txn = pd.to_datetime(txn['transaction_date']).max()
                days_since_last_txn = (self.reference_date - last_txn).days
                
                if months_since_join <= 3:
                    lifecycle_stage = 'onboarding'
                elif months_since_join <= 12:
                    lifecycle_stage = 'growth'
                elif days_since_last_txn > 60:
                    lifecycle_stage = 'at_risk'
                else:
                    lifecycle_stage = 'maturity'
            
            features.append({
                'customer_id': customer_id,
                'months_since_join': months_since_join,
                'days_since_last_txn': days_since_last_txn,
                'lifecycle_stage': lifecycle_stage
            })
        
        return pd.DataFrame(features)
    
    def _generate_change_features(self, customer_df: pd.DataFrame, transaction_df: pd.DataFrame):
        """변화 감지 Features"""
        features = []
        
        for customer_id in customer_df['customer_id']:
            txn = transaction_df[transaction_df['customer_id'] == customer_id].copy()
            
            if len(txn) == 0:
                features.append({'customer_id': customer_id, 'mom_change_rate': 0})
                continue
            
            txn['date'] = pd.to_datetime(txn['transaction_date'])
            
            recent_1m = txn[txn['date'] >= (self.reference_date - timedelta(days=30))]
            prev_1m = txn[(txn['date'] >= (self.reference_date - timedelta(days=60))) &
                         (txn['date'] < (self.reference_date - timedelta(days=30)))]
            
            recent_count = len(recent_1m)
            prev_count = len(prev_1m)
            mom_change_rate = (recent_count - prev_count) / max(1, prev_count)
            
            features.append({
                'customer_id': customer_id,
                'mom_change_rate': mom_change_rate
            })
        
        return pd.DataFrame(features)
