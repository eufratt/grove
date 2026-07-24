from datetime import datetime, timedelta
from sqlalchemy import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.db import AsyncSessionLocal
from app.config import settings
from app.models.order import Order, OrderStatus
from app.services.order_status_service import (
    system_timeout_confirmation,
    system_timeout_pickup,
    system_auto_confirm_received
)

scheduler = AsyncIOScheduler()

async def check_confirmation_timeouts():
    async with AsyncSessionLocal() as db:
        now = datetime.utcnow()
        threshold = now - timedelta(seconds=settings.TIMEOUT_KONFIRMASI)
        stmt = select(Order).where(
            Order.status == OrderStatus.MENUNGGU_KONFIRMASI,
            Order.created_at <= threshold
        )
        res = await db.execute(stmt)
        orders = res.scalars().all()
        
        for order in orders:
            try:
                # Process each transition in its own transaction context to avoid partial commits failure
                await system_timeout_confirmation(db, order)
            except Exception as e:
                print(f"Error processing confirmation timeout for order {order.id}: {e}")

async def check_pickup_and_auto_confirm():
    async with AsyncSessionLocal() as db:
        now = datetime.utcnow()
        
        # 1. Process pickup timeouts first (only for SIAP_DIAMBIL)
        threshold_pickup = now - timedelta(seconds=settings.TIMEOUT_PENGAMBILAN)
        stmt_pickup = select(Order).where(
            Order.status == OrderStatus.SIAP_DIAMBIL,
            Order.marked_ready_at <= threshold_pickup
        )
        res_pickup = await db.execute(stmt_pickup)
        orders_pickup = res_pickup.scalars().all()
        
        for order in orders_pickup:
            try:
                await system_timeout_pickup(db, order)
            except Exception as e:
                print(f"Error processing pickup timeout for order {order.id}: {e}")
                
    async with AsyncSessionLocal() as db:
        now = datetime.utcnow()
        # 2. Process auto-confirm received next (only for DIKIRIM)
        threshold_confirm = now - timedelta(seconds=settings.TIMEOUT_AUTO_CONFIRM)
        stmt_confirm = select(Order).where(
            Order.status == OrderStatus.DIKIRIM,
            Order.marked_ready_at <= threshold_confirm
        )
        res_confirm = await db.execute(stmt_confirm)
        orders_confirm = res_confirm.scalars().all()
        
        for order in orders_confirm:
            try:
                await system_auto_confirm_received(db, order)
            except Exception as e:
                print(f"Error processing auto-confirm received for order {order.id}: {e}")

def start_scheduler():
    scheduler.add_job(check_confirmation_timeouts, 'interval', seconds=30, id='check_confirmation_timeouts', replace_existing=True)
    scheduler.add_job(check_pickup_and_auto_confirm, 'interval', seconds=30, id='check_pickup_and_auto_confirm', replace_existing=True)
    scheduler.start()
    print("APScheduler started successfully.")

def shutdown_scheduler():
    scheduler.shutdown()
    print("APScheduler shut down successfully.")
