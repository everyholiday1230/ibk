# IBK 카드고객 이탈방지 시스템 - 기술 설계 문서

## 1. 생애주기 기준 정의 (Lifecycle Definition)

### 1.1 생애주기 5단계 프레임워크

```python
생애주기 정의 기준:
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Onboarding (신규 활성화)                       │
│ - 기준: 가입 후 0-3개월                                  │
│ - 특징: 첫 거래 발생 여부, 활성화 속도                   │
│ - 이탈 요인: 첫 사용 장벽, 혜택 인지 부족                │
│ - 목표: 첫 거래 유도, 습관 형성                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Stage 2: Growth (성장기)                                 │
│ - 기준: 가입 후 3-12개월 & 사용량 증가 추세              │
│ - 특징: 월 평균 거래 증가율 > 0                          │
│ - 이탈 요인: 혜택 한계 체감, 경쟁사 프로모션             │
│ - 목표: 사용 다양화, 주 결제카드 전환                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Stage 3: Maturity (성숙기)                               │
│ - 기준: 가입 12개월+ & 안정적 사용 패턴                  │
│ - 특징: 월 거래 건수 CV(변동계수) < 0.3                  │
│ - 이탈 요인: 경쟁 심화, 혜택 매력도 감소                 │
│ - 목표: 충성도 유지, 크로스셀                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Stage 4: Decline (쇠퇴기)                                │
│ - 기준: 최근 3개월 사용량 < 전년 동기 대비 50%           │
│ - 특징: 거래 감소 추세, 업종 사용 축소                   │
│ - 이탈 요인: 불만족, 대체카드 증가                       │
│ - 목표: 원인 파악, 적극적 개입                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Stage 5: At-Risk (이탈 직전)                             │
│ - 기준: 60일+ 미사용 OR 이탈 확률 > 70%                  │
│ - 특징: 명확한 이탈 신호                                 │
│ - 이탈 요인: 이미 타 카드로 전환 완료                    │
│ - 목표: 최후 방어, Win-back 캠페인                       │
└─────────────────────────────────────────────────────────┘
```

### 1.2 동적 생애주기 전환 로직

```python
def determine_lifecycle_stage(customer_data):
    """동적 생애주기 판정"""
    
    months_since_join = customer_data['months_since_join']
    days_since_last_txn = customer_data['days_since_last_txn']
    recent_3m_amount = customer_data['recent_3m_amount']
    prev_3m_amount = customer_data['prev_3m_amount']
    
    # Priority 1: At-Risk (가장 위험)
    if days_since_last_txn > 60:
        return 'at_risk'
    
    # Priority 2: Decline (감소 추세)
    if prev_3m_amount > 0 and recent_3m_amount / prev_3m_amount < 0.5:
        return 'decline'
    
    # Priority 3: Onboarding (신규)
    if months_since_join <= 3:
        return 'onboarding'
    
    # Priority 4: Growth (성장)
    if months_since_join <= 12 and recent_3m_amount > prev_3m_amount:
        return 'growth'
    
    # Default: Maturity (안정)
    return 'maturity'
```

---

## 2. 생애주기별 Feature 스코어링

### 2.1 Stage별 핵심 Features

```python
LIFECYCLE_FEATURES = {
    'onboarding': {
        'primary': [
            'days_to_first_transaction',  # 첫 거래까지 기간
            'first_month_txn_count',      # 첫 달 거래 건수
            'activation_speed_score',      # 활성화 속도
            'first_txn_amount',           # 첫 거래 금액
            'onboarding_engagement'        # 초기 참여도
        ],
        'weights': [0.30, 0.25, 0.20, 0.15, 0.10]
    },
    
    'growth': {
        'primary': [
            'mom_growth_rate',            # 월간 성장률
            'category_diversity',          # 업종 다양성
            'avg_monthly_amount',          # 월 평균 금액
            'usage_consistency',           # 사용 일관성
            'cross_category_score'         # 크로스 카테고리
        ],
        'weights': [0.30, 0.25, 0.20, 0.15, 0.10]
    },
    
    'maturity': {
        'primary': [
            'loyalty_score',               # 충성도 점수
            'main_card_probability',       # 주 카드 확률
            'spending_stability',          # 지출 안정성
            'benefit_utilization',         # 혜택 활용도
            'competitor_signal'            # 경쟁 신호
        ],
        'weights': [0.25, 0.25, 0.20, 0.15, 0.15]
    },
    
    'decline': {
        'primary': [
            'decline_rate',                # 감소율
            'consecutive_decline_months',  # 연속 감소 월
            'category_dropout_count',      # 이탈 업종 수
            'competitor_switch_signal',    # 경쟁사 전환
            'complaint_history'            # 불만 이력
        ],
        'weights': [0.35, 0.25, 0.20, 0.15, 0.05]
    },
    
    'at_risk': {
        'primary': [
            'days_since_last_txn',         # 마지막 거래 일수
            'historical_churn_pattern',    # 이탈 패턴 유사도
            'reactivation_attempts',       # 재활성화 시도
            'final_transaction_pattern',   # 마지막 거래 패턴
            'win_back_score'               # 회수 가능성
        ],
        'weights': [0.40, 0.25, 0.15, 0.12, 0.08]
    }
}
```

### 2.2 통합 스코어링 공식

```python
def calculate_churn_score(customer_data, lifecycle_stage):
    """생애주기별 이탈 위험 점수 계산"""
    
    features = LIFECYCLE_FEATURES[lifecycle_stage]['primary']
    weights = LIFECYCLE_FEATURES[lifecycle_stage]['weights']
    
    # Feature 정규화 (0-1 범위)
    normalized_features = []
    for feature in features:
        value = customer_data[feature]
        min_val, max_val = FEATURE_RANGES[feature]
        normalized = (value - min_val) / (max_val - min_val)
        normalized = np.clip(normalized, 0, 1)
        normalized_features.append(normalized)
    
    # 가중 평균
    weighted_score = sum(f * w for f, w in zip(normalized_features, weights))
    
    # 0-100점 변환
    churn_score = weighted_score * 100
    
    return churn_score
```

---

## 3. Feature별 가중치 결정 방법

### 3.1 3-Layer 가중치 시스템

```python
# Layer 1: Domain Expert Knowledge (도메인 전문가)
EXPERT_WEIGHTS = {
    'recency_days': 0.25,        # 최근성 - 가장 중요
    'frequency_decline': 0.20,    # 빈도 감소
    'monetary_drop': 0.15,        # 금액 감소
    'category_diversity': 0.12,   # 다양성
    # ... 나머지
}

# Layer 2: ML Feature Importance (머신러닝)
# XGBoost의 feature_importances_ 또는 SHAP values
def get_ml_weights(trained_model, X):
    shap_values = shap.TreeExplainer(trained_model).shap_values(X)
    importance = np.abs(shap_values).mean(axis=0)
    normalized_importance = importance / importance.sum()
    return dict(zip(X.columns, normalized_importance))

# Layer 3: Business Impact (비즈니스 임팩트)
BUSINESS_WEIGHTS = {
    'high_value_customer': 1.5,   # 고가치 고객 가중
    'long_tenure': 1.3,           # 장기 고객 가중
    'multi_product': 1.2,         # 다상품 고객 가중
    # ...
}

# 최종 가중치 = Expert × ML × Business
def compute_final_weights():
    final_weights = {}
    for feature in all_features:
        expert_w = EXPERT_WEIGHTS.get(feature, 0.01)
        ml_w = ML_WEIGHTS.get(feature, 0.01)
        business_w = BUSINESS_WEIGHTS.get(feature_category, 1.0)
        
        final_weights[feature] = expert_w * ml_w * business_w
    
    # 정규화
    total = sum(final_weights.values())
    return {k: v/total for k, v in final_weights.items()}
```

### 3.2 동적 가중치 업데이트

```python
# 월별 성능 기반 가중치 자동 조정
def adaptive_weight_update(current_weights, performance_metrics):
    """성능 기반 가중치 자동 조정"""
    
    if performance_metrics['precision'] < 0.7:
        # Precision 낮음 → False Positive 많음
        # 보수적 features 가중치 증가
        current_weights['recency_days'] *= 1.2
        current_weights['days_since_last_txn'] *= 1.2
    
    if performance_metrics['recall'] < 0.7:
        # Recall 낮음 → False Negative 많음
        # 민감한 features 가중치 증가
        current_weights['decline_rate'] *= 1.2
        current_weights['competitor_signal'] *= 1.2
    
    return normalize_weights(current_weights)
```

---

## 4. 정적 메타데이터 + 동적 변수 조합 전략

### 4.1 Feature Engineering 프레임워크

```python
class HybridFeatureEngine:
    """정적 + 동적 Feature 통합"""
    
    def transform(self, customer_metadata, transaction_history):
        features = {}
        
        # ===== 정적 Features (Metadata) =====
        features.update(self._encode_static(customer_metadata))
        
        # ===== 동적 Features (Behavioral) =====
        features.update(self._compute_dynamic(transaction_history))
        
        # ===== 교차 Features (Interaction) =====
        features.update(self._create_interactions(features))
        
        return features
    
    def _encode_static(self, metadata):
        """정적 메타데이터 인코딩"""
        return {
            # 원본
            'age': metadata['age'],
            'gender': metadata['gender'],  # One-hot
            'region': metadata['region'],  # One-hot
            'credit_grade': metadata['credit_grade'],
            
            # 파생
            'age_group': self._age_bucket(metadata['age']),
            'region_tier': self._region_tier(metadata['region']),
            'credit_risk_score': self._credit_score(metadata['credit_grade'])
        }
    
    def _compute_dynamic(self, txn_history):
        """동적 행동 변수"""
        return {
            # 시간 기반
            'recency_days': self._recency(txn_history),
            'frequency_30d': self._frequency(txn_history, days=30),
            'frequency_90d': self._frequency(txn_history, days=90),
            'monetary_30d': self._monetary(txn_history, days=30),
            
            # 추세
            'frequency_trend': self._trend(txn_history, 'count'),
            'monetary_trend': self._trend(txn_history, 'amount'),
            
            # 변동성
            'spending_volatility': self._volatility(txn_history),
            'usage_consistency': self._consistency(txn_history)
        }
    
    def _create_interactions(self, features):
        """교차 Features"""
        return {
            # 연령 × 사용패턴
            'young_high_spender': (features['age'] < 35) & (features['monetary_30d'] > 500000),
            
            # 지역 × 감소율
            'seoul_declining': (features['region'] == 'seoul') & (features['frequency_trend'] < -0.3),
            
            # 신용등급 × 이탈위험
            'high_credit_at_risk': (features['credit_grade'] <= 3) & (features['recency_days'] > 60),
            
            # 생애주기 × 행동
            'onboarding_inactive': (features['lifecycle_stage'] == 'onboarding') & (features['frequency_30d'] == 0)
        }
```

### 4.2 Feature Scaling 전략

```python
# 정적 vs 동적 Feature의 Scale 차이 보정
from sklearn.preprocessing import StandardScaler, RobustScaler

def scale_features(features_df):
    """Feature별 맞춤형 Scaling"""
    
    # 정적 Features: StandardScaler
    static_features = ['age', 'credit_grade', 'tenure_months']
    scaler_static = StandardScaler()
    features_df[static_features] = scaler_static.fit_transform(
        features_df[static_features]
    )
    
    # 동적 Features: RobustScaler (이상치에 강함)
    dynamic_features = ['recency_days', 'frequency_30d', 'monetary_30d']
    scaler_dynamic = RobustScaler()
    features_df[dynamic_features] = scaler_dynamic.fit_transform(
        features_df[dynamic_features]
    )
    
    # 범주형: One-hot Encoding (이미 0/1)
    # categorical_features는 그대로
    
    return features_df
```

---

## 5. 비지도 학습 기반 군집화 전략

### 5.1 Hybrid Approach (비지도 + 지도)

```python
# Step 1: 비지도 학습으로 고객 군집화
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA

def customer_segmentation(features_df, n_clusters=8):
    """고객 군집화"""
    
    # PCA로 차원 축소
    pca = PCA(n_components=20)
    features_reduced = pca.fit_transform(features_df)
    
    # K-Means 클러스터링
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(features_reduced)
    
    return clusters

# Step 2: 군집별 특성 분석
def analyze_clusters(df, clusters):
    """각 군집의 특성 파악"""
    
    df['cluster'] = clusters
    
    cluster_profiles = []
    for cluster_id in range(clusters.max() + 1):
        cluster_data = df[df['cluster'] == cluster_id]
        
        profile = {
            'cluster_id': cluster_id,
            'size': len(cluster_data),
            'churn_rate': cluster_data['churned'].mean(),
            'avg_recency': cluster_data['recency_days'].mean(),
            'avg_frequency': cluster_data['frequency_30d'].mean(),
            'avg_monetary': cluster_data['monetary_30d'].mean(),
            'dominant_lifecycle': cluster_data['lifecycle_stage'].mode()[0],
            'dominant_region': cluster_data['region'].mode()[0]
        }
        
        cluster_profiles.append(profile)
    
    return pd.DataFrame(cluster_profiles)

# 예시 결과:
# Cluster 0: "젊은 고빈도 사용자" (20-30대, 서울, 월 30회+)
# Cluster 1: "중년 안정 사용자" (40-50대, 경기, 월 10-20회)
# Cluster 2: "고가치 위험군" (고액, 감소 추세)
# Cluster 3: "신규 비활성" (가입 3개월 이내, 거래 0-2회)
# ...

# Step 3: 군집별 맞춤형 모델
def train_cluster_specific_models(df, clusters):
    """각 군집별 특화 모델"""
    
    models = {}
    for cluster_id in range(clusters.max() + 1):
        cluster_data = df[df['cluster'] == cluster_id]
        
        # 이 군집에서 중요한 Features만 선택
        important_features = select_features_for_cluster(cluster_data)
        
        X = cluster_data[important_features]
        y = cluster_data['churned']
        
        # 군집별 모델 학습
        model = XGBClassifier()
        model.fit(X, y)
        
        models[cluster_id] = {
            'model': model,
            'features': important_features,
            'threshold': optimize_threshold(model, X, y)
        }
    
    return models
```

### 5.2 이탈 유형 분류

```python
# 비지도 학습으로 이탈 패턴 발견
def identify_churn_patterns(churned_customers):
    """이탈 고객의 패턴 분류"""
    
    # 이탈 고객만 추출
    X_churned = churned_customers[behavior_features]
    
    # DBSCAN으로 이탈 패턴 군집화
    dbscan = DBSCAN(eps=0.5, min_samples=5)
    churn_patterns = dbscan.fit_predict(X_churned)
    
    # 패턴 해석
    patterns = {
        0: "급격한 사용 감소형",      # 갑자기 거래 중단
        1: "점진적 이탈형",           # 서서히 감소
        2: "경쟁사 전환형",           # 특정 시점 완전 중단
        3: "혜택 소진형",             # 프로모션 종료 후 이탈
        4: "라이프스타일 변화형"     # 업종 패턴 완전 변화
    }
    
    return churn_patterns, patterns
```

---

## 6. 지도학습 Feature Selection 전략

### 6.1 Multi-Stage Feature Selection

```python
# Stage 1: 통계적 유의성 검증
from sklearn.feature_selection import chi2, f_classif

def statistical_filtering(X, y, threshold=0.05):
    """통계적으로 유의한 Features만 선택"""
    
    # 연속형 변수: F-test
    continuous_features = X.select_dtypes(include=[np.number]).columns
    f_values, p_values = f_classif(X[continuous_features], y)
    
    significant_features = continuous_features[p_values < threshold]
    
    return significant_features.tolist()

# Stage 2: 상관관계 제거
def remove_correlated_features(X, threshold=0.9):
    """다중공선성 제거"""
    
    corr_matrix = X.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    
    to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
    
    return X.drop(columns=to_drop)

# Stage 3: Recursive Feature Elimination
from sklearn.feature_selection import RFE

def recursive_elimination(X, y, n_features=50):
    """재귀적 Feature 제거"""
    
    estimator = XGBClassifier()
    selector = RFE(estimator, n_features_to_select=n_features, step=1)
    selector.fit(X, y)
    
    selected_features = X.columns[selector.support_].tolist()
    
    return selected_features

# Stage 4: SHAP-based Importance
def shap_based_selection(model, X, top_k=50):
    """SHAP 값 기반 Feature 선택"""
    
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    
    # 절대값 평균으로 중요도 계산
    importance = np.abs(shap_values).mean(axis=0)
    
    # Top-K 선택
    top_indices = np.argsort(importance)[-top_k:]
    selected_features = X.columns[top_indices].tolist()
    
    return selected_features

# 통합 Pipeline
def select_optimal_features(X, y):
    """4단계 Feature Selection"""
    
    # Stage 1
    features = statistical_filtering(X, y)
    X_filtered = X[features]
    
    # Stage 2
    X_filtered = remove_correlated_features(X_filtered)
    
    # Stage 3
    features = recursive_elimination(X_filtered, y, n_features=70)
    X_filtered = X_filtered[features]
    
    # Stage 4
    model = XGBClassifier()
    model.fit(X_filtered, y)
    final_features = shap_based_selection(model, X_filtered, top_k=50)
    
    return final_features
```

### 6.2 과적합 방지 전략

```python
# 1. Cross-Validation
from sklearn.model_selection import StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# 2. Regularization
model = XGBClassifier(
    reg_alpha=1.0,      # L1 regularization
    reg_lambda=1.0,     # L2 regularization
    max_depth=6,        # 깊이 제한
    min_child_weight=5  # 최소 샘플 수
)

# 3. Early Stopping
model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    early_stopping_rounds=50,
    verbose=False
)

# 4. Dropout (Neural Network의 경우)
# 5. Ensemble (여러 모델 결합)
```

---

## 7. 모델 선택 & Threshold 최적화

### 7.1 Ensemble Model Architecture

```python
class OptimizedChurnEnsemble:
    """최적화된 앙상블 모델"""
    
    def __init__(self):
        # Model 1: XGBoost (Feature Importance 우수)
        self.xgb = XGBClassifier(
            objective='binary:logistic',
            eval_metric='auc',
            max_depth=6,
            learning_rate=0.05,
            n_estimators=500,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=6.7,  # 이탈률 13% 반영
            reg_alpha=1.0,
            reg_lambda=1.0
        )
        
        # Model 2: LightGBM (속도 & 성능)
        self.lgb = LGBMClassifier(
            objective='binary',
            metric='auc',
            num_leaves=31,
            learning_rate=0.05,
            n_estimators=500,
            scale_pos_weight=6.7,
            reg_alpha=1.0,
            reg_lambda=1.0
        )
        
        # Model 3: CatBoost (범주형 변수 처리)
        self.catboost = CatBoostClassifier(
            iterations=500,
            learning_rate=0.05,
            depth=6,
            scale_pos_weight=6.7,
            verbose=False
        )
        
        # Model 4: Neural Network (복잡한 패턴)
        self.nn = self._build_neural_network()
        
        self.ensemble_weights = None
    
    def fit(self, X_train, y_train, X_val, y_val):
        """앙상블 학습"""
        
        # 개별 모델 학습
        self.xgb.fit(X_train, y_train)
        self.lgb.fit(X_train, y_train)
        self.catboost.fit(X_train, y_train)
        # self.nn.fit(X_train, y_train)  # TensorFlow
        
        # 검증 데이터로 최적 가중치 탐색
        val_predictions = {
            'xgb': self.xgb.predict_proba(X_val)[:, 1],
            'lgb': self.lgb.predict_proba(X_val)[:, 1],
            'catboost': self.catboost.predict_proba(X_val)[:, 1]
        }
        
        # Bayesian Optimization으로 가중치 최적화
        self.ensemble_weights = self._optimize_weights(
            val_predictions, y_val
        )
    
    def predict_proba(self, X):
        """앙상블 예측"""
        
        pred_xgb = self.xgb.predict_proba(X)[:, 1]
        pred_lgb = self.lgb.predict_proba(X)[:, 1]
        pred_cat = self.catboost.predict_proba(X)[:, 1]
        
        # 가중 평균
        ensemble_pred = (
            pred_xgb * self.ensemble_weights['xgb'] +
            pred_lgb * self.ensemble_weights['lgb'] +
            pred_cat * self.ensemble_weights['catboost']
        )
        
        return ensemble_pred
```

### 7.2 Threshold 최적화 전략

```python
def optimize_threshold(y_true, y_pred_proba, business_costs):
    """비즈니스 목표 기반 Threshold 최적화"""
    
    # 비용 정의
    cost_fn = business_costs['false_negative']  # 놓친 이탈: -1,000,000원
    cost_fp = business_costs['false_positive']  # 잘못된 개입: -50,000원
    benefit_tp = business_costs['true_positive']  # 방지 성공: +800,000원
    
    best_threshold = 0.5
    best_profit = -np.inf
    
    # 0.1 ~ 0.9 범위에서 탐색
    for threshold in np.arange(0.1, 0.9, 0.01):
        y_pred = (y_pred_proba >= threshold).astype(int)
        
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        
        # 총 이익 계산
        total_profit = (
            tp * benefit_tp +
            fn * cost_fn +
            fp * cost_fp
        )
        
        if total_profit > best_profit:
            best_profit = total_profit
            best_threshold = threshold
    
    return best_threshold, best_profit

# 생애주기별 Threshold
LIFECYCLE_THRESHOLDS = {
    'onboarding': 0.45,   # 민감하게 (False Negative 방지)
    'growth': 0.50,       # 균형
    'maturity': 0.55,     # 보수적으로
    'decline': 0.40,      # 매우 민감하게
    'at_risk': 0.35       # 최대한 민감하게
}

# 고객 가치별 Threshold
def adjust_threshold_by_clv(base_threshold, clv_score):
    """CLV 기반 Threshold 조정"""
    
    if clv_score > 10000000:  # 1천만원 이상
        return base_threshold * 0.7  # 더 민감하게
    elif clv_score > 5000000:
        return base_threshold * 0.85
    else:
        return base_threshold
```

### 7.3 모델 성능 목표

```python
PERFORMANCE_TARGETS = {
    'auc': 0.85,           # AUC-ROC
    'precision': 0.75,     # 정밀도 (개입의 정확성)
    'recall': 0.80,        # 재현율 (이탈 포착률)
    'f1': 0.77,           # F1-Score
    
    # 비즈니스 지표
    'top_10_percent_capture': 0.60,  # 상위 10% 고객 중 실제 이탈 60% 포함
    'cost_per_save': 50000,           # 고객당 방지 비용
    'roi': 15.0                       # ROI 15배 이상
}
```

---

## 요약: 통합 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Data Layer                             │
│  - 정적: 나이, 성별, 지역, 신용등급                        │
│  - 동적: 거래 이력, RFM, 생애주기                          │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│              Feature Engineering                          │
│  - 100+ Raw Features                                      │
│  - 통계적 필터링 → 상관관계 제거                           │
│  - RFE → SHAP → 최종 50개 Features                        │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│            Clustering (Optional)                          │
│  - K-Means: 8개 고객 군집                                 │
│  - 군집별 특성 분석                                        │
│  - 군집별 맞춤 모델 (Optional)                             │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│           Ensemble Model (Main)                           │
│  - XGBoost (40%) + LightGBM (40%) + CatBoost (20%)       │
│  - Bayesian Optimization 가중치                           │
│  - 생애주기별 특화 모델                                     │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│         Threshold Optimization                            │
│  - 생애주기별: 0.35 ~ 0.55                                │
│  - CLV 기반 동적 조정                                      │
│  - 비즈니스 비용 최적화                                     │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│            Prediction & Action                            │
│  - 이탈 확률 (0-100%)                                     │
│  - 위험 등급 (Low/Medium/High/Critical)                   │
│  - 추천 액션 (자동 캠페인)                                 │
└──────────────────────────────────────────────────────────┘
```

---

**다음 단계: 이 설계를 코드로 구현하겠습니다!**
