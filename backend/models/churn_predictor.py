"""
IBK 카드고객 이탈 예측 모델
- XGBoost + LightGBM Ensemble
- SHAP 기반 설명 가능성
- 생애주기별 맞춤형 예측
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import joblib
from datetime import datetime
import logging

# ML Libraries
import xgboost as xgb
import lightgbm as lgb
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, 
    f1_score, confusion_matrix, classification_report
)

# Explainability
import shap

# Imbalanced Data Handling
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline as ImbPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChurnPredictor:
    """
    고객 이탈 예측 모델
    
    Features:
    - Ensemble learning (XGBoost + LightGBM + RF)
    - Imbalanced data handling (SMOTE + Under-sampling)
    - SHAP explainability
    - Lifecycle-aware prediction
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.models = {}
        self.ensemble = None
        self.explainer = None
        self.feature_names = None
        self.is_fitted = False
        
    def _default_config(self) -> Dict:
        """기본 모델 설정 (GPU 가속)"""
        return {
            'xgb_params': {
                'objective': 'binary:logistic',
                'eval_metric': 'auc',
                'max_depth': 8,
                'learning_rate': 0.05,
                'n_estimators': 1000,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'scale_pos_weight': 5,
                'random_state': 42,
                'tree_method': 'gpu_hist',
                'gpu_id': 0,
                'predictor': 'gpu_predictor'
            },
            'lgb_params': {
                'objective': 'binary',
                'metric': 'auc',
                'boosting_type': 'gbdt',
                'num_leaves': 63,
                'learning_rate': 0.05,
                'n_estimators': 1000,
                'feature_fraction': 0.8,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'scale_pos_weight': 5,
                'random_state': 42,
                'device': 'gpu',
                'gpu_platform_id': 0,
                'gpu_device_id': 0,
                'verbose': -1
            },
            'rf_params': {
                'n_estimators': 500,
                'max_depth': 20,
                'min_samples_split': 10,
                'min_samples_leaf': 5,
                'class_weight': 'balanced',
                'random_state': 42,
                'n_jobs': -1
            }
        }
    
    def prepare_data(self, X: pd.DataFrame, y: pd.Series, balance: bool = True):
        """데이터 전처리 및 불균형 처리"""
        X = X.fillna(X.median())
        self.feature_names = X.columns.tolist()
        
        if balance and y is not None:
            over = SMOTE(sampling_strategy=0.5, random_state=42)
            under = RandomUnderSampler(sampling_strategy=0.8, random_state=42)
            pipeline = ImbPipeline(steps=[('over', over), ('under', under)])
            X_balanced, y_balanced = pipeline.fit_resample(X, y)
            return X_balanced, y_balanced
        
        return X, y
    
    def train(self, X_train: pd.DataFrame, y_train: pd.Series,
              X_val: Optional[pd.DataFrame] = None, y_val: Optional[pd.Series] = None):
        """모델 학습 (GPU 가속)"""
        logger.info("🚀 Starting Model Training with GPU Acceleration")
        logger.info("   Using Tesla T4 GPU")
        
        X_train_processed, y_train_processed = self.prepare_data(X_train, y_train)
        
        # XGBoost (GPU)
        logger.info("   [1/3] Training XGBoost on GPU...")
        self.models['xgb'] = xgb.XGBClassifier(**self.config['xgb_params'])
        self.models['xgb'].fit(X_train_processed, y_train_processed)
        logger.info("   ✓ XGBoost completed")
        
        # LightGBM (GPU)
        logger.info("   [2/3] Training LightGBM on GPU...")
        self.models['lgb'] = lgb.LGBMClassifier(**self.config['lgb_params'])
        self.models['lgb'].fit(X_train_processed, y_train_processed)
        logger.info("   ✓ LightGBM completed")
        
        # Random Forest (CPU - 병렬)
        logger.info("   [3/3] Training Random Forest...")
        self.models['rf'] = RandomForestClassifier(**self.config['rf_params'])
        self.models['rf'].fit(X_train_processed, y_train_processed)
        logger.info("   ✓ Random Forest completed")
        
        # Ensemble
        logger.info("   Creating ensemble model...")
        self.ensemble = VotingClassifier(
            estimators=[('xgb', self.models['xgb']), ('lgb', self.models['lgb']), ('rf', self.models['rf'])],
            voting='soft', weights=[2, 2, 1]
        )
        self.ensemble.fit(X_train_processed, y_train_processed)
        
        # SHAP
        logger.info("   Initializing SHAP explainer...")
        self.explainer = shap.TreeExplainer(self.models['xgb'])
        self.is_fitted = True
        logger.info("   ✓ Training completed!")
        
        if X_val is not None and y_val is not None:
            return self.evaluate(X_val, y_val)
        return {}
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """이탈 확률 예측"""
        if not self.is_fitted:
            raise ValueError("Model is not fitted yet.")
        X = X.fillna(X.median())
        return self.ensemble.predict_proba(X)
    
    def predict_with_score(self, X: pd.DataFrame) -> pd.DataFrame:
        """이탈 확률 및 위험도 점수"""
        proba = self.predict_proba(X)
        risk_score = (proba[:, 1] * 100).round(1)
        risk_level = pd.cut(risk_score, bins=[0, 50, 70, 90, 100], labels=['Low', 'Medium', 'High', 'Critical'])
        
        return pd.DataFrame({
            'churn_probability': proba[:, 1],
            'risk_score': risk_score,
            'risk_level': risk_level,
            'predicted_churn': (proba[:, 1] >= 0.5).astype(int)
        })
    
    def explain(self, X: pd.DataFrame, customer_id: Optional[int] = None) -> Dict:
        """SHAP 설명"""
        if not self.is_fitted or self.explainer is None:
            raise ValueError("Model not fitted or explainer not available.")
        
        shap_values = self.explainer.shap_values(X)
        
        if customer_id is not None:
            idx = customer_id if isinstance(customer_id, int) else 0
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'shap_value': shap_values[idx],
                'feature_value': X.iloc[idx].values
            }).sort_values('shap_value', ascending=False, key=abs)
            
            return {
                'customer_id': customer_id,
                'top_factors': feature_importance.head(10).to_dict('records'),
                'shap_values': shap_values[idx].tolist()
            }
        
        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': mean_abs_shap
        }).sort_values('importance', ascending=False)
        
        return {'global_importance': feature_importance.to_dict('records')}
    
    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """모델 성능 평가"""
        y_proba = self.predict_proba(X_test)[:, 1]
        y_pred = (y_proba >= 0.5).astype(int)
        
        return {
            'auc': roc_auc_score(y_test, y_proba),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred)
        }
    
    def save(self, filepath: str):
        """모델 저장"""
        joblib.dump({
            'ensemble': self.ensemble,
            'models': self.models,
            'config': self.config,
            'feature_names': self.feature_names,
            'explainer': self.explainer
        }, filepath)
        logger.info(f"✅ Model saved to {filepath}")
    
    def load(self, filepath: str):
        """모델 로드"""
        data = joblib.load(filepath)
        self.ensemble = data['ensemble']
        self.models = data['models']
        self.config = data['config']
        self.feature_names = data['feature_names']
        self.explainer = data.get('explainer')
        self.is_fitted = True
        logger.info(f"✅ Model loaded from {filepath}")
        return self
    
    @classmethod
    def load_from_file(cls, filepath: str):
        """파일에서 모델 로드 (클래스 메서드)"""
        instance = cls()
        instance.load(filepath)
        return instance
