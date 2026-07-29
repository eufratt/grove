import pytest
import uuid
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone
from sqlalchemy import select

from app.db import AsyncSessionLocal
from app.config import settings
from app.models.user import User, UserRole
from app.models.product import Product, ProductStatus
from app.models.order import Order, OrderStatus
from app.models.demand_request import DemandRequest, DemandRequestStatus
from app.models.payment_transaction import (
    DemandTransaction,
    PaymentTransaction,
    PaymentStatus,
    EscrowStatus
)
from app.services.escrow_service import escrow_service

import pytest_asyncio

pytestmark = pytest.mark.asyncio

@pytest_asyncio.fixture
async def test_escrow_context():
    # Reset engine connections
    from app.db import engine
    await engine.dispose()

    async with AsyncSessionLocal() as db:
        # Create Buyer
        buyer_id = uuid.uuid4()
        buyer = User(
            id=buyer_id,
            email=f"buyer_{buyer_id.hex[:6]}@test.com",
            google_sub=f"sub_{buyer_id.hex[:6]}",
            full_name="Test Buyer",
            role=UserRole.PEMBELI,
            phone_whatsapp="081234567890"
        )
        db.add(buyer)

        # Create Seller
        seller_id = uuid.uuid4()
        seller = User(
            id=seller_id,
            email=f"seller_{seller_id.hex[:6]}@test.com",
            google_sub=f"sub_{seller_id.hex[:6]}",
            full_name="Test Seller",
            role=UserRole.PETANI,
            phone_whatsapp="089876543210"
        )
        db.add(seller)
        await db.flush()

        # Create Product
        product = Product(
            id=uuid.uuid4(),
            seller_id=seller.id,
            name="Cabe Rawit Hijau",
            category="Sayuran",
            quantity_kg=50.0,
            price_per_kg=40000.0,
            status=ProductStatus.TERSEDIA
        )
        db.add(product)

        # Create Demand Request
        demand = DemandRequest(
            id=uuid.uuid4(),
            buyer_id=buyer.id,
            commodity_name="Cabe Rawit Hijau",
            category="Sayuran",
            quantity_kg_needed=20.0,
            price_per_kg=40000.0,
            deadline=datetime.now(timezone.utc).replace(tzinfo=None),
            status=DemandRequestStatus.TERBUKA
        )
        db.add(demand)
        await db.commit()

        try:
            yield db, buyer, seller, product, demand
        finally:
            from sqlalchemy import delete
            try:
                await db.rollback()
            except Exception:
                pass
            try:
                await db.execute(delete(DemandTransaction).where(DemandTransaction.demand_request_id == demand.id))
                await db.execute(delete(PaymentTransaction))
                await db.execute(delete(Order).where(Order.product_id == product.id))
                await db.execute(delete(DemandRequest).where(DemandRequest.id == demand.id))
                await db.execute(delete(Product).where(Product.id == product.id))
                await db.execute(delete(User).where(User.id == buyer.id))
                await db.execute(delete(User).where(User.id == seller.id))
                await db.commit()
            except Exception as e:
                print(f"Error during test context cleanup: {e}")
                await db.rollback()
            await db.close()

@patch("app.services.xendit_service.xendit_service.create_disbursement", new_callable=AsyncMock)
@patch("app.services.xendit_service.xendit_service.create_invoice", new_callable=AsyncMock)
async def test_order_escrow_lifecycle(mock_create_invoice, mock_create_disbursement, test_escrow_context):
    db, buyer, seller, product, demand = test_escrow_context

    # Mock return values
    mock_create_invoice.return_value = ("https://checkout.xendit.co/v2/test-invoice", "inv-12345")
    mock_create_disbursement.return_value = {"id": "disb-1111", "status": "PENDING"}

    # Set seller bank details
    seller.bank_name = "MANDIRI"
    seller.bank_account_number = "1234567890"
    seller.bank_account_holder = "Test Seller"
    db.add(seller)
    await db.commit()

    # 1. Create order
    order = Order(
        id=uuid.uuid4(),
        product_id=product.id,
        buyer_id=buyer.id,
        quantity_kg=5.0,
        status=OrderStatus.MENUNGGU_KONFIRMASI
    )
    db.add(order)
    await db.commit()

    # 2. Checkout
    invoice_url = await escrow_service.checkout_transaction(
        db=db,
        source_type="pesanan",
        source_id=order.id,
        buyer_email=buyer.email,
        success_redirect_url="http://test.com/success",
        failure_redirect_url="http://test.com/failure"
    )

    assert invoice_url == "https://checkout.xendit.co/v2/test-invoice"
    
    # Reload order to assert pending state
    await db.refresh(order)
    assert order.payment_status == PaymentStatus.PENDING
    assert order.escrow_status == EscrowStatus.NOT_STARTED
    assert order.xendit_invoice_id == "inv-12345"
    assert order.xendit_external_id is not None

    # Check that generic PaymentTransaction log was created
    stmt_tx = select(PaymentTransaction).where(PaymentTransaction.source_id == order.id)
    res_tx = await db.execute(stmt_tx)
    payment_tx = res_tx.scalar_one()
    assert payment_tx.amount == 200000.0  # 5kg * 40000.0

    # 3. Simulate payment webhook PAID callback
    await escrow_service.handle_payment_success(db, order.xendit_external_id, "inv-12345")
    await db.refresh(order)
    assert order.payment_status == PaymentStatus.PAID
    assert order.escrow_status == EscrowStatus.HELD
    assert order.status == OrderStatus.DIPROSES

    # 4. Simulate Buyer Confirm Received -> Release escrow
    # Set status to SIAP_DIAMBIL to satisfy state machine checks
    order.status = OrderStatus.SIAP_DIAMBIL
    db.add(order)
    await db.commit()

    await escrow_service.confirm_received_and_release(db, "pesanan", order.id, buyer.id)
    await db.refresh(order)
    assert order.escrow_status == EscrowStatus.RELEASED
    assert order.status == OrderStatus.SELESAI
    assert order.confirmed_received_at is not None
    assert order.disbursement_id == "disb-1111"
    assert order.disbursement_status == "pending"
    assert order.disbursed_at is not None

@patch("app.services.xendit_service.xendit_service.create_disbursement", new_callable=AsyncMock)
@patch("app.services.xendit_service.xendit_service.create_invoice", new_callable=AsyncMock)
async def test_demand_escrow_lifecycle(mock_create_invoice, mock_create_disbursement, test_escrow_context):
    db, buyer, seller, product, demand = test_escrow_context
    mock_create_invoice.return_value = ("https://checkout.xendit.co/v2/test-invoice-demand", "inv-67890")
    mock_create_disbursement.return_value = {"id": "disb-2222", "status": "PENDING"}

    # Set seller bank details
    seller.bank_name = "BRI"
    seller.bank_account_number = "0987654321"
    seller.bank_account_holder = "Test Seller"
    db.add(seller)
    await db.commit()

    # 1. Create a matched DemandTransaction (transaksi_permintaan)
    dt = DemandTransaction(
        id=uuid.uuid4(),
        demand_request_id=demand.id,
        seller_id=seller.id,
        quantity_kg=10.0,
        price_per_kg=40000.0,
        amount=400000.0,
        payment_status=PaymentStatus.PENDING,
        escrow_status=EscrowStatus.NOT_STARTED,
        xendit_external_id=f"permintaan_{demand.id.hex}_test"
    )
    db.add(dt)
    await db.commit()

    # 2. Checkout
    invoice_url = await escrow_service.checkout_transaction(
        db=db,
        source_type="permintaan",
        source_id=dt.id,
        buyer_email=buyer.email,
        success_redirect_url="http://test.com/success",
        failure_redirect_url="http://test.com/failure"
    )

    assert invoice_url == "https://checkout.xendit.co/v2/test-invoice-demand"

    # Reload transaction to assert pending state
    await db.refresh(dt)
    assert dt.payment_status == PaymentStatus.PENDING
    assert dt.escrow_status == EscrowStatus.NOT_STARTED
    assert dt.xendit_invoice_id == "inv-67890"

    # 3. Simulate payment webhook
    await escrow_service.handle_payment_success(db, dt.xendit_external_id, "inv-67890")
    await db.refresh(dt)
    assert dt.payment_status == PaymentStatus.PAID
    assert dt.escrow_status == EscrowStatus.HELD

    # 4. Confirm Received -> Release escrow
    await escrow_service.confirm_received_and_release(db, "permintaan", dt.id, buyer.id)
    await db.refresh(dt)
    assert dt.escrow_status == EscrowStatus.RELEASED
    assert dt.released_at is not None
    assert dt.disbursement_id == "disb-2222"
    assert dt.disbursement_status == "pending"
    assert dt.disbursed_at is not None

from httpx import AsyncClient
from main import app

async def test_xendit_webhook_endpoint_casing(test_escrow_context):
    db, buyer, seller, product, demand = test_escrow_context

    # Create an order in pending payment state
    order = Order(
        id=uuid.uuid4(),
        product_id=product.id,
        buyer_id=buyer.id,
        quantity_kg=5.0,
        status=OrderStatus.MENUNGGU_KONFIRMASI,
        xendit_external_id="pesanan_test_webhook_external_id",
        xendit_invoice_id="inv-webhook-test",
        payment_status=PaymentStatus.PENDING
    )
    db.add(order)
    
    # We also need a PaymentTransaction log
    payment_tx = PaymentTransaction(
        source_type="pesanan",
        source_id=order.id,
        xendit_external_id="pesanan_test_webhook_external_id",
        amount=200000.0
    )
    db.add(payment_tx)
    await db.commit()

    # 1. Test standard mixed-case header "X-Callback-Token"
    payload = {
        "external_id": "pesanan_test_webhook_external_id",
        "id": "inv-webhook-test",
        "status": "PAID"
    }

    import httpx
    async with AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/webhooks/xendit",
            json=payload,
            headers={"X-Callback-Token": settings.XENDIT_WEBHOOK_TOKEN}
        )
    
    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # Refresh order and assert paid
    await db.refresh(order)
    assert order.payment_status == PaymentStatus.PAID
    assert order.escrow_status == EscrowStatus.HELD

    # 2. Test invalid webhook token to ensure it still properly rejects unauthorized requests
    import httpx
    async with AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/webhooks/xendit",
            json=payload,
            headers={"X-Callback-Token": "invalid-token"}
        )
    assert response.status_code == 401

