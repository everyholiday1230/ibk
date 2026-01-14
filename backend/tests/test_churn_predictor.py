"""
Unit Tests for ChurnPredictor
"""

import pytest
import pandas as pd
import numpy as np
from backend.models.churn_predictor import ChurnPredictor


@pytest.fixture
def sample_data():
    """샘플 데이터 생성"""
    np.random.seed(42)
    n_samples = 1000
    n_features = 20
    
    X = pd.DataFrame(
        np.random.randn(n_samples, n_features),
        columns=[f'feature_{i}' for i in range(n_features)]
    )
    y = pd.Series(np.random.choice([0, 1], size=n_samples, p=[0.87, 0.13]))
    
    return X, y


def test_model_initialization():
    """모델 초기화 테스트"""
    model = ChurnPredictor()
    assert model is not None
    assert not model.is_fitted
    assert model.config is not None


def test_model_training(sample_data):
    """모델 학습 테스트"""
    X, y = sample_data
    X_train, X_test = X[:800], X[800:]
    y_train, y_test = y[:800], y[800:]
    
    model = ChurnPredictor()
    metrics = model.train(X_train, y_train, X_test, y_test)
    
    assert model.is_fitted
    assert 'auc' in metrics
    assert metrics['auc'] > 0.5  # Better than random


def test_model_prediction(sample_data):
    """모델 예측 테스트"""
    X, y = sample_data
    X_train, X_test = X[:800], X[800:]
    y_train, y_test = y[:800], y[800:]
    
    model = ChurnPredictor()
    model.train(X_train, y_train)
    
    predictions = model.predict_with_score(X_test)
    
    assert len(predictions) == len(X_test)
    assert 'churn_probability' in predictions.columns
    assert 'risk_score' in predictions.columns
    assert 'risk_level' in predictions.columns
    assert predictions['risk_score'].max() <= 100
    assert predictions['risk_score'].min() >= 0


def test_model_save_load(sample_data, tmp_path):
    """모델 저장/로드 테스트"""
    X, y = sample_data
    X_train = X[:800]
    y_train = y[:800]
    
    # 학습 및 저장
    model1 = ChurnPredictor()
    model1.train(X_train, y_train)
    
    model_path = tmp_path / "test_model.pkl"
    model1.save(str(model_path))
    
    # 로드 및 검증
    model2 = ChurnPredictor()
    model2.load(str(model_path))
    
    assert model2.is_fitted
    assert model2.feature_names == model1.feature_names
    
    # 같은 예측 결과
    X_test = X[800:]
    pred1 = model1.predict_proba(X_test)
    pred2 = model2.predict_proba(X_test)
    
    np.testing.assert_array_almost_equal(pred1, pred2)
