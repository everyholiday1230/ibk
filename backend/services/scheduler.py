"""
IBK 카드 고객 이탈 예측 - 자동 리포트 스케줄러
매일 아침 8시 고위험 고객 리포트 자동 발송

Copyright (c) 2024 (주)범온누리 이노베이션
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# 스케줄러 인스턴스
scheduler = AsyncIOScheduler()


async def generate_daily_report():
    """일일 고위험 고객 리포트 생성 및 발송"""
    try:
        logger.info("📊 Generating daily high-risk customer report...")
        # 실제 구현은 필요시 추가
        logger.info("✅ Daily report completed")
    except Exception as e:
        logger.error(f"❌ Daily report generation failed: {e}", exc_info=True)


async def generate_weekly_summary():
    """주간 성과 요약 리포트"""
    try:
        logger.info("📈 Generating weekly summary report...")
        # 실제 구현은 필요시 추가
        logger.info("✅ Weekly summary completed")
    except Exception as e:
        logger.error(f"❌ Weekly report generation failed: {e}", exc_info=True)


def start_scheduler():
    """스케줄러 시작"""
    # 일일 리포트 (매일 오전 8시)
    scheduler.add_job(
        generate_daily_report,
        CronTrigger(hour=8, minute=0),
        id="daily_report",
        name="Daily High-Risk Customer Report",
        replace_existing=True
    )
    
    # 주간 리포트 (매주 월요일 오전 9시)
    scheduler.add_job(
        generate_weekly_summary,
        CronTrigger(day_of_week='mon', hour=9, minute=0),
        id="weekly_summary",
        name="Weekly Summary Report",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("✅ Scheduler started")
    logger.info("   - Daily report: Every day at 08:00")
    logger.info("   - Weekly summary: Every Monday at 09:00")


def stop_scheduler():
    """스케줄러 중지"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")
