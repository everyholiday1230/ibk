"""
모델 학습 스크립트
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging
import argparse
from datetime import datetime

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models.churn_predictor import ChurnPredictor
from backend.services.feature_engineering import FeatureEngineer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_data(data_dir: str = 'data/synthetic'):
    """데이터 로드"""
    logger.info(f"📂 Loading data from {data_dir}")
    
    customers_df = pd.read_csv(f"{data_dir}/customers.csv")
    transactions_df = pd.read_csv(f"{data_dir}/transactions.csv")
    
    logger.info(f"   Customers: {len(customers_df):,}")
    logger.info(f"   Transactions: {len(transactions_df):,}")
    
    return customers_df, transactions_df


def prepare_features(customers_df, transactions_df):
    """Feature Engineering"""
    logger.info("🔧 Feature Engineering...")
    
    engineer = FeatureEngineer()
    features_df = engineer.transform(customers_df, transactions_df)
    
    # 레이블 분리
    X = features_df.drop(columns=['customer_id', 'churned'])
    y = features_df['churned']
    
    # 날짜 타입 제거
    date_cols = X.select_dtypes(include=['datetime64']).columns
    X = X.drop(columns=date_cols)
    
    # 범주형 변수 인코딩
    categorical_cols = X.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        X[col] = pd.Categorical(X[col]).codes
    
    logger.info(f"   Features: {X.shape[1]}")
    logger.info(f"   Samples: {len(X)}")
    logger.info(f"   Churn rate: {y.mean():.2%}")
    
    return X, y


def train_model(X_train, y_train, X_val, y_val):
    """모델 학습"""
    logger.info("🚀 Training model...")
    
    predictor = ChurnPredictor()
    metrics = predictor.train(X_train, y_train, X_val, y_val)
    
    logger.info("\n📊 Validation Metrics:")
    for metric, value in metrics.items():
        if isinstance(value, float):
            logger.info(f"   {metric}: {value:.4f}")
    
    return predictor, metrics


def save_model(predictor, output_dir: str = 'ml/models'):
    """모델 저장"""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_path = f"{output_dir}/churn_model_{timestamp}.pkl"
    
    predictor.save(model_path)
    
    # 최신 모델로 심볼릭 링크
    latest_path = f"{output_dir}/churn_model_latest.pkl"
    import os
    if os.path.exists(latest_path):
        os.remove(latest_path)
    os.symlink(os.path.basename(model_path), latest_path)
    
    logger.info(f"✅ Model saved: {model_path}")
    logger.info(f"   Latest: {latest_path}")


def main():
    parser = argparse.ArgumentParser(description='Train churn prediction model')
    parser.add_argument('--data-dir', default='data/synthetic', help='Data directory')
    parser.add_argument('--output-dir', default='ml/models', help='Output directory')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test set ratio')
    
    args = parser.parse_args()
    
    logger.info("="*60)
    logger.info("IBK CHURN PREDICTION MODEL TRAINING")
    logger.info("="*60)
    
    # 1. 데이터 로드
    customers_df, transactions_df = load_data(args.data_dir)
    
    # 2. Feature Engineering
    X, y = prepare_features(customers_df, transactions_df)
    
    # 3. Train/Test Split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, stratify=y, random_state=42
    )
    
    # 4. 모델 학습
    predictor, metrics = train_model(X_train, y_train, X_test, y_test)
    
    # 5. 모델 저장
    save_model(predictor, args.output_dir)
    
    logger.info("\n" + "="*60)
    logger.info("✅ TRAINING COMPLETED!")
    logger.info("="*60)
    logger.info(f"AUC: {metrics['auc']:.4f}")
    logger.info(f"Precision: {metrics['precision']:.4f}")
    logger.info(f"Recall: {metrics['recall']:.4f}")
    logger.info(f"F1: {metrics['f1']:.4f}")


if __name__ == "__main__":
    main()
