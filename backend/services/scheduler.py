"""
IBK 카드 고객 이탈 예측 - 자동 리포트 스케줄러
매일 아침 8시 고위험 고객 리포트 자동 발송

Copyright (c) 2024 (주)범온누리 이노베이션
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import logging
import os
from typing import List
import io

import pandas as pd
from sqlalchemy.orm import Session

from backend.services.db import get_db_context
from backend.models.database import Customer, CustomerAction, Campaign

logger = logging.getLogger(__name__)

# 스케줄러 인스턴스
scheduler = AsyncIOScheduler()


async def generate_daily_report():
    """일일 고위험 고객 리포트 생성 및 발송"""
    try:
        logger.info("📊 Generating daily high-risk customer report...")
        
        with get_db_context() as db:
            # 고위험 고객 조회 (이탈 확률 70% 이상)
            high_risk_customers = db.query(Customer).filter(
                Customer.churn_probability >= 0.70
            ).order_by(Customer.churn_probability.desc()).limit(100).all()
            
            if not high_risk_customers:
                logger.info("No high-risk customers found.")
                return
            
            # 데이터프레임 변환
            data = []
            for customer in high_risk_customers:
                # 최근 액션 확인
                last_action = db.query(CustomerAction).filter(
                    CustomerAction.customer_id == customer.customer_id
                ).order_by(CustomerAction.action_date.desc()).first()
                
                data.append({
                    '고객ID': customer.customer_id,
                    '이탈확률': f"{customer.churn_probability * 100:.1f}%",
                    '위험등급': customer.risk_level,
                    '생애주기': customer.lifecycle_stage,
                    '카드등급': customer.card_type,
                    '지역': customer.region,
                    '연령': customer.age,
                    '연소득': f"{customer.annual_income:,}만원",
                    '최근액션': last_action.action_type if last_action else '없음',
                    '액션일자': last_action.action_date.strftime('%Y-%m-%d') if last_action else '-',
                    '예측일자': customer.last_prediction_date.strftime('%Y-%m-%d') if customer.last_prediction_date else '-'
                })
            
            df = pd.DataFrame(data)
            
            # Excel 파일 생성
            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='고위험고객', index=False)
                
                # 통계 시트
                stats_data = {
                    '항목': ['총 고위험 고객 수', '평균 이탈 확률', '신규 고객', '성장 고객', '성숙 고객', '쇠퇴 고객'],
                    '값': [
                        len(df),
                        df['이탈확률'].str.rstrip('%').astype(float).mean(),
                        len(df[df['생애주기'] == '신규']),
                        len(df[df['생애주기'] == '성장']),
                        len(df[df['생애주기'] == '성숙']),
                        len(df[df['생애주기'] == '쇠퇴'])
                    ]
                }
                pd.DataFrame(stats_data).to_excel(writer, sheet_name='요약', index=False)
            
            excel_buffer.seek(0)
            
            # 이메일 발송
            await send_email_report(
                recipients=os.getenv("REPORT_RECIPIENTS", "manager@ibk.co.kr").split(","),
                subject=f"[IBK] 일일 고위험 고객 리포트 - {datetime.now().strftime('%Y년 %m월 %d일')}",
                body=f"""
                <h2>IBK 카드 고위험 고객 일일 리포트</h2>
                <p><strong>(주)범온누리 이노베이션</strong> - IBK 카드 고객 이탈 예측 AI</p>
                
                <h3>📊 요약</h3>
                <ul>
                    <li>총 고위험 고객: <strong>{len(df)}명</strong></li>
                    <li>평균 이탈 확률: <strong>{df['이탈확률'].str.rstrip('%').astype(float).mean():.1f}%</strong></li>
                    <li>생애주기별:
                        <ul>
                            <li>신규: {len(df[df['생애주기'] == '신규'])}명</li>
                            <li>성장: {len(df[df['생애주기'] == '성장'])}명</li>
                            <li>성숙: {len(df[df['생애주기'] == '성숙'])}명</li>
                            <li>쇠퇴: {len(df[df['생애주기'] == '쇠퇴'])}명</li>
                        </ul>
                    </li>
                </ul>
                
                <h3>💡 권장 액션</h3>
                <ol>
                    <li>고위험 고객 우선 상담 진행</li>
                    <li>생애주기별 맞춤 캠페인 실행</li>
                    <li>VIP 고객 특별 관리 강화</li>
                </ol>
                
                <p>상세 내역은 첨부된 Excel 파일을 확인하세요.</p>
                
                <hr>
                <p style="font-size: 12px; color: #666;">
                    이 리포트는 매일 오전 8시 자동 발송됩니다.<br>
                    문의: (주)범온누리 이노베이션
                </p>
                """,
                attachment=excel_buffer.getvalue(),
                attachment_name=f"IBK_고위험고객_{datetime.now().strftime('%Y%m%d')}.xlsx"
            )
            
            logger.info(f"✅ Daily report sent: {len(df)} high-risk customers")
            
    except Exception as e:
        logger.error(f"❌ Daily report generation failed: {e}", exc_info=True)


async def generate_weekly_summary():
    """주간 성과 요약 리포트"""
    try:
        logger.info("📈 Generating weekly summary report...")
        
        with get_db_context() as db:
            # 최근 7일 통계
            week_ago = datetime.now() - timedelta(days=7)
            
            # 캠페인 성과
            campaigns = db.query(Campaign).filter(
                Campaign.created_at >= week_ago
            ).all()
            
            # 액션 통계
            actions = db.query(CustomerAction).filter(
                CustomerAction.action_date >= week_ago
            ).all()
            
            # 이탈 방지 성공 건수
            successful_actions = [a for a in actions if a.is_successful]
            
            # 리포트 내용 생성
            report_body = f"""
            <h2>IBK 카드 이탈 방지 주간 성과 리포트</h2>
            <p><strong>(주)범온누리 이노베이션</strong></p>
            <p>{week_ago.strftime('%Y년 %m월 %d일')} ~ {datetime.now().strftime('%Y년 %m월 %d일')}</p>
            
            <h3>🎯 주요 성과</h3>
            <ul>
                <li>총 캠페인 수: <strong>{len(campaigns)}개</strong></li>
                <li>총 액션 수: <strong>{len(actions)}건</strong></li>
                <li>이탈 방지 성공: <strong>{len(successful_actions)}건</strong></li>
                <li>성공률: <strong>{len(successful_actions) / len(actions) * 100 if actions else 0:.1f}%</strong></li>
            </ul>
            
            <h3>📊 캠페인 성과</h3>
            <table border="1" cellpadding="5" style="border-collapse: collapse;">
                <tr style="background-color: #f0f0f0;">
                    <th>캠페인명</th>
                    <th>발송</th>
                    <th>오픈률</th>
                    <th>전환율</th>
                    <th>ROI</th>
                </tr>
            """
            
            for campaign in campaigns:
                report_body += f"""
                <tr>
                    <td>{campaign.campaign_name}</td>
                    <td>{campaign.sent_count}</td>
                    <td>{campaign.engagement_rate * 100:.1f}%</td>
                    <td>{campaign.conversion_rate * 100:.1f}%</td>
                    <td>{campaign.roi:.1f}%</td>
                </tr>
                """
            
            report_body += """
            </table>
            
            <hr>
            <p style="font-size: 12px; color: #666;">
                주간 리포트는 매주 월요일 오전 9시에 발송됩니다.
            </p>
            """
            
            # 이메일 발송
            await send_email_report(
                recipients=os.getenv("REPORT_RECIPIENTS", "manager@ibk.co.kr").split(","),
                subject=f"[IBK] 주간 성과 리포트 - {datetime.now().strftime('%Y년 %m월 %d일')}",
                body=report_body
            )
            
            logger.info("✅ Weekly summary report sent")
            
    except Exception as e:
        logger.error(f"❌ Weekly report generation failed: {e}", exc_info=True)


async def send_email_report(
    recipients: List[str],
    subject: str,
    body: str,
    attachment: bytes = None,
    attachment_name: str = None
):
    """이메일 발송 (실제 구현 시 SMTP 설정 필요)"""
    # TODO: 실제 이메일 발송 구현 (aiosmtplib 사용)
    logger.info(f"📧 Email report prepared: {subject}")
    logger.info(f"   Recipients: {', '.join(recipients)}")
    logger.info(f"   Attachment: {attachment_name if attachment else 'None'}")
    
    # 개발 모드에서는 파일로 저장
    if os.getenv("SAVE_REPORTS_TO_FILE", "true").lower() == "true":
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        if attachment and attachment_name:
            file_path = os.path.join(reports_dir, attachment_name)
            with open(file_path, "wb") as f:
                f.write(attachment)
            logger.info(f"   💾 Saved to: {file_path}")


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
