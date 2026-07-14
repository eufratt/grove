from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db import get_db
from app.models.user import User, UserRole
from app.models.demand_request import DemandRequest, DemandRequestStatus, SupplyCommitment
from app.schemas.demand_request import (
    DemandRequestCreate, 
    DemandCommitmentCreate, 
    DemandRequestResponse, 
    DemandRequestDetailResponse,
    SupplyCommitmentSummary
)
from app.services import auth_service
from app.services.connection_manager import demand_manager
from typing import List, Optional
import uuid

router = APIRouter(prefix="/demand-requests", tags=["demand-requests"])

@router.post("", response_model=DemandRequestResponse)
async def create_demand_request(
    body: DemandRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    if current_user.role not in [UserRole.PEMBELI, UserRole.AGEN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya pembeli atau agen yang dapat membuat permintaan"
        )
    
    if not current_user.location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lengkapi koordinat lokasi pada profil Anda terlebih dahulu."
        )

    new_request = DemandRequest(
        buyer_id=current_user.id,
        commodity_name=body.commodity_name,
        category=body.category,
        quantity_kg_needed=body.quantity_kg_needed,
        quantity_kg_committed=0.0,
        deadline=body.deadline,
        status=DemandRequestStatus.TERBUKA,
        location=current_user.location
    )

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)

    # Convert geography location coordinates for the response
    stmt = select(
        func.ST_Y(new_request.location).label("latitude"),
        func.ST_X(new_request.location).label("longitude")
    )
    res = await db.execute(stmt)
    row = res.first()
    lat, lng = row if row else (None, None)

    return {
        "id": new_request.id,
        "buyer_id": new_request.buyer_id,
        "commodity_name": new_request.commodity_name,
        "category": new_request.category,
        "quantity_kg_needed": new_request.quantity_kg_needed,
        "quantity_kg_committed": new_request.quantity_kg_committed,
        "deadline": new_request.deadline,
        "status": new_request.status,
        "created_at": new_request.created_at,
        "latitude": lat,
        "longitude": lng
    }

@router.get("", response_model=List[DemandRequestResponse])
async def list_open_demand_requests(
    db: AsyncSession = Depends(get_db)
):
    # Retrieve only TERBUKA requests sorted by shortest deadline,
    # then by lowest progress percentage (least fulfilled first)
    stmt = select(
        DemandRequest,
        func.ST_Y(DemandRequest.location).label("latitude"),
        func.ST_X(DemandRequest.location).label("longitude")
    ).where(
        DemandRequest.status == DemandRequestStatus.TERBUKA
    ).order_by(
        DemandRequest.deadline.asc(),
        (DemandRequest.quantity_kg_committed / DemandRequest.quantity_kg_needed).asc()
    )

    res = await db.execute(stmt)
    records = res.all()

    items = []
    for request, lat, lng in records:
        items.append({
            "id": request.id,
            "buyer_id": request.buyer_id,
            "commodity_name": request.commodity_name,
            "category": request.category,
            "quantity_kg_needed": request.quantity_kg_needed,
            "quantity_kg_committed": request.quantity_kg_committed,
            "deadline": request.deadline,
            "status": request.status,
            "created_at": request.created_at,
            "latitude": lat,
            "longitude": lng
        })
    return items

@router.get("/mine", response_model=List[DemandRequestResponse])
async def list_my_demand_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    stmt = select(
        DemandRequest,
        func.ST_Y(DemandRequest.location).label("latitude"),
        func.ST_X(DemandRequest.location).label("longitude")
    ).where(
        DemandRequest.buyer_id == current_user.id
    ).order_by(
        DemandRequest.created_at.desc()
    )

    res = await db.execute(stmt)
    records = res.all()

    items = []
    for request, lat, lng in records:
        items.append({
            "id": request.id,
            "buyer_id": request.buyer_id,
            "commodity_name": request.commodity_name,
            "category": request.category,
            "quantity_kg_needed": request.quantity_kg_needed,
            "quantity_kg_committed": request.quantity_kg_committed,
            "deadline": request.deadline,
            "status": request.status,
            "created_at": request.created_at,
            "latitude": lat,
            "longitude": lng
        })
    return items

@router.get("/{id}", response_model=DemandRequestDetailResponse)
async def get_demand_request_detail(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(
        DemandRequest,
        func.ST_Y(DemandRequest.location).label("latitude"),
        func.ST_X(DemandRequest.location).label("longitude")
    ).where(
        DemandRequest.id == id
    )

    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permintaan tidak ditemukan"
        )
    request, lat, lng = row

    # Fetch commitments
    stmt_commitments = select(SupplyCommitment).where(
        SupplyCommitment.demand_request_id == id
    ).order_by(
        SupplyCommitment.committed_at.desc()
    )
    res_commitments = await db.execute(stmt_commitments)
    commitments = res_commitments.scalars().all()

    # Fetch distinct count of petani who committed
    stmt_count_petani = select(func.count(func.distinct(SupplyCommitment.petani_id))).where(
        SupplyCommitment.demand_request_id == id
    )
    res_count_petani = await db.execute(stmt_count_petani)
    num_petani = res_count_petani.scalar() or 0

    commits_list = [{
        "id": c.id,
        "quantity_kg_committed": c.quantity_kg_committed,
        "committed_at": c.committed_at
    } for c in commitments]

    return {
        "id": request.id,
        "buyer_id": request.buyer_id,
        "commodity_name": request.commodity_name,
        "category": request.category,
        "quantity_kg_needed": request.quantity_kg_needed,
        "quantity_kg_committed": request.quantity_kg_committed,
        "deadline": request.deadline,
        "status": request.status,
        "created_at": request.created_at,
        "latitude": lat,
        "longitude": lng,
        "commitments": commits_list,
        "num_petani_committed": num_petani
    }

@router.post("/{id}/commit", response_model=SupplyCommitmentSummary)
async def commit_supply_to_demand(
    id: uuid.UUID,
    body: DemandCommitmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    if current_user.role != UserRole.PETANI:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya petani yang dapat melakukan komitmen supply"
        )

    stmt = select(DemandRequest).where(DemandRequest.id == id)
    res = await db.execute(stmt)
    request = res.scalar_one_or_none()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permintaan tidak ditemukan"
        )
    
    if request.status != DemandRequestStatus.TERBUKA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permintaan sudah tidak terbuka untuk komitmen"
        )

    # Create commitment
    commitment = SupplyCommitment(
        demand_request_id=id,
        petani_id=current_user.id,
        quantity_kg_committed=body.quantity_kg
    )

    db.add(commitment)
    
    # Increment total committed on the demand request
    request.quantity_kg_committed += body.quantity_kg
    if request.quantity_kg_committed >= request.quantity_kg_needed:
        request.status = DemandRequestStatus.TERPENUHI

    await db.commit()
    await db.refresh(commitment)
    await db.refresh(request)

    # Fetch distinct count of petani who committed
    stmt_count_petani = select(func.count(func.distinct(SupplyCommitment.petani_id))).where(
        SupplyCommitment.demand_request_id == id
    )
    res_count_petani = await db.execute(stmt_count_petani)
    num_petani = res_count_petani.scalar() or 0

    # Broadcast updated stats to active WebSocket subscribers
    await demand_manager.broadcast(
        str(id),
        {
            "quantity_kg_committed": request.quantity_kg_committed,
            "status": request.status.value,
            "num_petani_committed": num_petani
        }
    )

    return {
        "id": commitment.id,
        "quantity_kg_committed": commitment.quantity_kg_committed,
        "committed_at": commitment.committed_at
    }
