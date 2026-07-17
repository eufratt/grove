from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import aliased
from typing import List, Optional
from uuid import UUID

from app.db import get_db
from app.models.user import User, UserRole
from app.models.product import Product, ProductStatus
from app.models.order import Order, OrderStatus
from app.models.rating import Rating, TransactionType
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
    buyer_confirmed_at: Optional[datetime] = None
    has_buyer_rated: bool = False
    created_at: datetime
    
    # Joined metadata fields
    product_name: Optional[str] = None
    product_photo_url: Optional[str] = None
    price_per_kg: Optional[float] = None
    buyer_name: Optional[str] = None
    buyer_phone: Optional[str] = None
    seller_name: Optional[str] = None
    seller_phone: Optional[str] = None
    
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
    
    # 1. Validation: Quantity must be greater than 0
    if order_data.quantity_kg <= 0:
        raise HTTPException(
            status_code=400,
            detail="Jumlah pesanan tidak valid"
        )
        
    # 2. Get product with SELECT FOR UPDATE to prevent race conditions
    result = await db.execute(
        select(Product)
        .where(Product.id == order_data.product_id)
        .with_for_update()
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Check if buying own product
    if product.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat membeli produk milik sendiri"
        )
        
    # 3. Check if product is available
    if product.status != ProductStatus.TERSEDIA:
        raise HTTPException(
            status_code=400,
            detail="Produk sudah tidak tersedia"
        )
        
    # 4. Check if quantity exceeds stock
    if product.quantity_kg < order_data.quantity_kg:
        raise HTTPException(
            status_code=400,
            detail="Jumlah melebihi stok tersedia"
        )
        
    # 5. Deduct stock
    product.quantity_kg -= order_data.quantity_kg
    if product.quantity_kg <= 0:
        product.quantity_kg = 0.0
        product.status = ProductStatus.TERJUAL
        
    # 6. Create order
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
    BuyerUser = aliased(User, name="buyer")
    SellerUser = aliased(User, name="seller")
    
    has_buyer_rated_sub = (
        select(func.count(Rating.id))
        .where(
            Rating.reference_id == Order.id,
            Rating.transaction_type == TransactionType.PRODUCT_PURCHASE,
            Rating.rater_id == Order.buyer_id
        )
        .scalar_subquery() > 0
    ).label("has_buyer_rated")
    
    stmt = (
        select(
            Order,
            Product.name.label("product_name"),
            Product.photo_url.label("product_photo_url"),
            Product.price_per_kg.label("price_per_kg"),
            BuyerUser.full_name.label("buyer_name"),
            BuyerUser.phone_whatsapp.label("buyer_phone"),
            SellerUser.full_name.label("seller_name"),
            SellerUser.phone_whatsapp.label("seller_phone"),
            has_buyer_rated_sub
        )
        .join(Product, Order.product_id == Product.id)
        .join(BuyerUser, Order.buyer_id == BuyerUser.id)
        .join(SellerUser, Product.seller_id == SellerUser.id)
        .where(
            or_(
                Order.buyer_id == current_user.id,
                Product.seller_id == current_user.id
            )
        )
        .order_by(Order.created_at.desc())
    )
    
    result = await db.execute(stmt)
    orders_data = []
    for row in result:
        order = row.Order
        orders_data.append(OrderResponse(
            id=order.id,
            product_id=order.product_id,
            buyer_id=order.buyer_id,
            quantity_kg=order.quantity_kg,
            status=order.status,
            buyer_confirmed_at=order.buyer_confirmed_at,
            created_at=order.created_at,
            product_name=row.product_name,
            product_photo_url=row.product_photo_url,
            price_per_kg=row.price_per_kg,
            buyer_name=row.buyer_name,
            buyer_phone=row.buyer_phone,
            seller_name=row.seller_name,
            seller_phone=row.seller_phone,
            has_buyer_rated=row.has_buyer_rated
        ))
    return orders_data

@router.get("/incoming", response_model=List[OrderResponse])
async def list_incoming_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    if current_user.role != UserRole.PETANI:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya petani yang dapat melihat pesanan masuk"
        )
    
    BuyerUser = aliased(User, name="buyer")
    SellerUser = aliased(User, name="seller")
    
    has_buyer_rated_sub = (
        select(func.count(Rating.id))
        .where(
            Rating.reference_id == Order.id,
            Rating.transaction_type == TransactionType.PRODUCT_PURCHASE,
            Rating.rater_id == Order.buyer_id
        )
        .scalar_subquery() > 0
    ).label("has_buyer_rated")
    
    stmt = (
        select(
            Order,
            Product.name.label("product_name"),
            Product.photo_url.label("product_photo_url"),
            Product.price_per_kg.label("price_per_kg"),
            BuyerUser.full_name.label("buyer_name"),
            BuyerUser.phone_whatsapp.label("buyer_phone"),
            SellerUser.full_name.label("seller_name"),
            SellerUser.phone_whatsapp.label("seller_phone"),
            has_buyer_rated_sub
        )
        .join(Product, Order.product_id == Product.id)
        .join(BuyerUser, Order.buyer_id == BuyerUser.id)
        .join(SellerUser, Product.seller_id == SellerUser.id)
        .where(Product.seller_id == current_user.id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    orders_data = []
    for row in result:
        order = row.Order
        orders_data.append(OrderResponse(
            id=order.id,
            product_id=order.product_id,
            buyer_id=order.buyer_id,
            quantity_kg=order.quantity_kg,
            status=order.status,
            buyer_confirmed_at=order.buyer_confirmed_at,
            created_at=order.created_at,
            product_name=row.product_name,
            product_photo_url=row.product_photo_url,
            price_per_kg=row.price_per_kg,
            buyer_name=row.buyer_name,
            buyer_phone=row.buyer_phone,
            seller_name=row.seller_name,
            seller_phone=row.seller_phone,
            has_buyer_rated=row.has_buyer_rated
        ))
    return orders_data

@router.get("/my-purchases", response_model=List[OrderResponse])
async def list_my_purchases(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    BuyerUser = aliased(User, name="buyer")
    SellerUser = aliased(User, name="seller")
    
    has_buyer_rated_sub = (
        select(func.count(Rating.id))
        .where(
            Rating.reference_id == Order.id,
            Rating.transaction_type == TransactionType.PRODUCT_PURCHASE,
            Rating.rater_id == Order.buyer_id
        )
        .scalar_subquery() > 0
    ).label("has_buyer_rated")
    
    stmt = (
        select(
            Order,
            Product.name.label("product_name"),
            Product.photo_url.label("product_photo_url"),
            Product.price_per_kg.label("price_per_kg"),
            BuyerUser.full_name.label("buyer_name"),
            BuyerUser.phone_whatsapp.label("buyer_phone"),
            SellerUser.full_name.label("seller_name"),
            SellerUser.phone_whatsapp.label("seller_phone"),
            has_buyer_rated_sub
        )
        .join(Product, Order.product_id == Product.id)
        .join(BuyerUser, Order.buyer_id == BuyerUser.id)
        .join(SellerUser, Product.seller_id == SellerUser.id)
        .where(Order.buyer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    orders_data = []
    for row in result:
        order = row.Order
        orders_data.append(OrderResponse(
            id=order.id,
            product_id=order.product_id,
            buyer_id=order.buyer_id,
            quantity_kg=order.quantity_kg,
            status=order.status,
            buyer_confirmed_at=order.buyer_confirmed_at,
            created_at=order.created_at,
            product_name=row.product_name,
            product_photo_url=row.product_photo_url,
            price_per_kg=row.price_per_kg,
            buyer_name=row.buyer_name,
            buyer_phone=row.buyer_phone,
            seller_name=row.seller_name,
            seller_phone=row.seller_phone,
            has_buyer_rated=row.has_buyer_rated
        ))
    return orders_data

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


@router.patch("/{order_id}/confirm-success", response_model=OrderResponse)
async def confirm_order_success(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Hanya pembeli yang dapat mengonfirmasi keberhasilan transaksi")
    
    if order.buyer_confirmed_at:
        raise HTTPException(status_code=400, detail="Transaksi sudah dikonfirmasi sebelumnya")

    order.buyer_confirmed_at = datetime.utcnow()
    order.status = OrderStatus.SELESAI
    
    await db.commit()
    await db.refresh(order)
    
    # Real-time update via WebSocket
    await connection_manager.manager.broadcast_to_order(
        str(order.id), 
        {"order_id": str(order.id), "status": order.status.value}
    )
    
    # Retrieve full details with joined metadata fields
    BuyerUser = aliased(User, name="buyer")
    SellerUser = aliased(User, name="seller")
    
    has_buyer_rated_sub = (
        select(func.count(Rating.id))
        .where(
            Rating.reference_id == Order.id,
            Rating.transaction_type == TransactionType.PRODUCT_PURCHASE,
            Rating.rater_id == Order.buyer_id
        )
        .scalar_subquery() > 0
    ).label("has_buyer_rated")

    stmt_full = (
        select(
            Order,
            Product.name.label("product_name"),
            Product.photo_url.label("product_photo_url"),
            Product.price_per_kg.label("price_per_kg"),
            BuyerUser.full_name.label("buyer_name"),
            BuyerUser.phone_whatsapp.label("buyer_phone"),
            SellerUser.full_name.label("seller_name"),
            SellerUser.phone_whatsapp.label("seller_phone"),
            has_buyer_rated_sub
        )
        .join(Product, Order.product_id == Product.id)
        .join(BuyerUser, Order.buyer_id == BuyerUser.id)
        .join(SellerUser, Product.seller_id == SellerUser.id)
        .where(Order.id == order.id)
    )
    
    res_full = await db.execute(stmt_full)
    row = res_full.first()
    if not row:
        raise HTTPException(status_code=404, detail="Order details not found")
        
    return OrderResponse(
        id=row.Order.id,
        product_id=row.Order.product_id,
        buyer_id=row.Order.buyer_id,
        quantity_kg=row.Order.quantity_kg,
        status=row.Order.status,
        buyer_confirmed_at=row.Order.buyer_confirmed_at,
        created_at=row.Order.created_at,
        product_name=row.product_name,
        product_photo_url=row.product_photo_url,
        price_per_kg=row.price_per_kg,
        buyer_name=row.buyer_name,
        buyer_phone=row.buyer_phone,
        seller_name=row.seller_name,
        seller_phone=row.seller_phone,
        has_buyer_rated=row.has_buyer_rated
    )

