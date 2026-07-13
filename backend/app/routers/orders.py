from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List
from uuid import UUID

from app.db import get_db
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.services import auth_service, connection_manager
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/orders", tags=["orders"])

class OrderCreate(BaseModel):
    product_id: UUID
    quantity_kg: float

class OrderResponse(BaseModel):
    id: UUID
    product_id: UUID
    buyer_id: UUID
    quantity_kg: float
    status: OrderStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    if not current_user.phone_whatsapp:
        raise HTTPException(
            status_code=400,
            detail="Nomor telepon wajib diisi sebelum checkout"
        )
    # Check if product exists
    result = await db.execute(select(Product).where(Product.id == order_data.product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_order = Order(
        product_id=order_data.product_id,
        buyer_id=current_user.id,
        quantity_kg=order_data.quantity_kg,
        status=OrderStatus.DIPESAN
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    return new_order

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    # Show orders where user is either buyer or seller
    stmt = select(Order).join(Product).where(
        or_(
            Order.buyer_id == current_user.id,
            Product.seller_id == current_user.id
        )
    ).order_by(Order.created_at.desc())
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status: OrderStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    stmt = select(Order).join(Product).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if product exists to find seller (already joined)
    # result_prod = await db.execute(select(Product).where(Product.id == order.product_id))
    # product = result_prod.scalar_one()
    
    # Simple check: only seller can update status (usually)
    # For some status (like 'selesai' or 'batal'), maybe buyer can too? 
    # Let's stick to seller for now as per instructions.
    
    # Find the seller_id from the joined Product table in the first query
    # To be safe, let's explicitly get the product
    res_p = await db.execute(select(Product).where(Product.id == order.product_id))
    product = res_p.scalar_one()
    
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can update order status")
    
    order.status = status
    await db.commit()
    await db.refresh(order)
    
    # Real-time update via WebSocket
    await connection_manager.manager.broadcast_to_order(
        str(order.id), 
        {"order_id": str(order.id), "status": status.value}
    )
    
    return order
