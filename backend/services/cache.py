"""
IBK 카드 고객 이탈 예측 - Redis 캐싱
예측 결과 캐싱 및 성능 최적화

Copyright (c) 2024 (주)범온누리 이노베이션
"""

import redis
import json
import logging
import os
from typing import Optional, Any
from functools import wraps
import hashlib

logger = logging.getLogger(__name__)

# Redis 연결 설정
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Redis 클라이언트
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5
    )
    # 연결 테스트
    redis_client.ping()
    logger.info(f"✅ Redis connected: {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.warning(f"⚠️ Redis connection failed: {e}. Caching disabled.")
    redis_client = None


def is_redis_available() -> bool:
    """Redis 사용 가능 여부 확인"""
    if redis_client is None:
        return False
    try:
        redis_client.ping()
        return True
    except:
        return False


def cache_key(*args, **kwargs) -> str:
    """캐시 키 생성 (함수 인자 기반)"""
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()


def cache_prediction(customer_id: str, prediction: dict, ttl: int = 3600):
    """
    예측 결과 캐싱
    
    Args:
        customer_id: 고객 ID
        prediction: 예측 결과 딕셔너리
        ttl: Time To Live (초, 기본 1시간)
    """
    if not is_redis_available():
        return
    
    try:
        key = f"prediction:{customer_id}"
        redis_client.setex(
            key,
            ttl,
            json.dumps(prediction)
        )
        logger.debug(f"Cached prediction for {customer_id}")
    except Exception as e:
        logger.warning(f"Cache write failed: {e}")


def get_cached_prediction(customer_id: str) -> Optional[dict]:
    """
    캐시된 예측 결과 가져오기
    
    Args:
        customer_id: 고객 ID
    
    Returns:
        예측 결과 딕셔너리 또는 None
    """
    if not is_redis_available():
        return None
    
    try:
        key = f"prediction:{customer_id}"
        cached = redis_client.get(key)
        
        if cached:
            logger.debug(f"Cache hit for {customer_id}")
            return json.loads(cached)
        
        logger.debug(f"Cache miss for {customer_id}")
        return None
    except Exception as e:
        logger.warning(f"Cache read failed: {e}")
        return None


def cache_decorator(prefix: str = "cache", ttl: int = 3600):
    """
    함수 결과 캐싱 데코레이터
    
    Usage:
        @cache_decorator(prefix="customer", ttl=1800)
        def get_customer_data(customer_id: str):
            return expensive_operation(customer_id)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not is_redis_available():
                return func(*args, **kwargs)
            
            # 캐시 키 생성
            key = f"{prefix}:{cache_key(*args, **kwargs)}"
            
            # 캐시 확인
            try:
                cached = redis_client.get(key)
                if cached:
                    logger.debug(f"Cache hit: {func.__name__}")
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
            
            # 함수 실행
            result = func(*args, **kwargs)
            
            # 결과 캐싱
            try:
                redis_client.setex(key, ttl, json.dumps(result))
                logger.debug(f"Cached: {func.__name__}")
            except Exception as e:
                logger.warning(f"Cache write error: {e}")
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str = "*"):
    """
    캐시 무효화
    
    Args:
        pattern: 삭제할 키 패턴 (예: "prediction:*", "customer:*")
    """
    if not is_redis_available():
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries: {pattern}")
    except Exception as e:
        logger.warning(f"Cache invalidation failed: {e}")


def get_cache_stats() -> dict:
    """캐시 통계"""
    if not is_redis_available():
        return {"status": "disabled"}
    
    try:
        info = redis_client.info()
        return {
            "status": "connected",
            "used_memory": info.get("used_memory_human", "N/A"),
            "connected_clients": info.get("connected_clients", 0),
            "total_keys": redis_client.dbsize(),
            "hit_rate": f"{info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1), 1) * 100:.2f}%"
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        return {"status": "error", "message": str(e)}
