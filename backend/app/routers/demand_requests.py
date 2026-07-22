from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db import get_db
from app.models.user import User, UserRole
from app.models.demand_request import DemandRequest, DemandRequestStatus, SupplyCommitment
from app.models.rating import Rating, TransactionType
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
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/demand-requests", tags=["demand-requests"])

@router.post("", response_model=DemandRequestResponse)
async def create_demand_request(
    body: DemandRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    if current_user.role != UserRole.PEMBELI:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya pembeli yang dapat membuat permintaan"
        )

    deadline = body.deadline
    if deadline.tzinfo is not None:
        from datetime import timezone
        deadline = deadline.astimezone(timezone.utc).replace(tzinfo=None)

    new_request = DemandRequest(
        buyer_id=current_user.id,
        commodity_name=body.commodity_name,
        category=body.category,
        quantity_kg_needed=body.quantity_kg_needed,
        quantity_kg_committed=0.0,
        price_per_kg=body.price_per_kg,
        deadline=deadline,
        status=DemandRequestStatus.TERBUKA,
        location=WKTElement(f"POINT({body.longitude} {body.latitude})", srid=4326)
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
        "price_per_kg": new_request.price_per_kg,
        "deadline": new_request.deadline,
        "status": new_request.status,
        "created_at": new_request.created_at,
        "latitude": lat,
        "longitude": lng,
        "buyer_name": current_user.full_name,
        "buyer_rating_avg": current_user.buyer_rating_avg,
        "buyer_rating_count": current_user.buyer_rating_count
    }

@router.get("", response_model=List[DemandRequestResponse])
async def list_open_demand_requests(
    db: AsyncSession = Depends(get_db)
):
    # Retrieve only TERBUKA requests sorted by shortest deadline,
    # then by lowest progress percentage (least fulfilled first)
    from sqlalchemy.orm import joinedload
    stmt = select(
        DemandRequest,
        func.ST_Y(DemandRequest.location).label("latitude"),
        func.ST_X(DemandRequest.location).label("longitude")
    ).options(
        joinedload(DemandRequest.buyer)
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
            "price_per_kg": request.price_per_kg,
            "deadline": request.deadline,
            "status": request.status,
            "created_at": request.created_at,
            "latitude": lat,
            "longitude": lng,
            "buyer_name": request.buyer.full_name if request.buyer else None,
            "buyer_rating_avg": request.buyer.buyer_rating_avg if request.buyer else None,
            "buyer_rating_count": request.buyer.buyer_rating_count if request.buyer else 0,
        })
    return items

@router.get("/mine", response_model=List[DemandRequestResponse])
async def list_my_demand_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    from sqlalchemy.orm import joinedload
    stmt = select(
        DemandRequest,
        func.ST_Y(DemandRequest.location).label("latitude"),
        func.ST_X(DemandRequest.location).label("longitude")
    ).options(
        joinedload(DemandRequest.buyer)
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
            "price_per_kg": request.price_per_kg,
            "deadline": request.deadline,
            "status": request.status,
            "created_at": request.created_at,
            "latitude": lat,
            "longitude": lng,
            "buyer_name": request.buyer.full_name if request.buyer else None,
            "buyer_rating_avg": request.buyer.buyer_rating_avg if request.buyer else None,
            "buyer_rating_count": request.buyer.buyer_rating_count if request.buyer else 0,
        })
    return items

@router.get("/committed", response_model=List[DemandRequestDetailResponse])
async def list_committed_demand_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    from sqlalchemy.orm import selectinload, joinedload
    
    if current_user.role == UserRole.PEMBELI:
        stmt = (
            select(DemandRequest)
            .options(
                joinedload(DemandRequest.buyer),
                selectinload(DemandRequest.commitments).selectinload(SupplyCommitment.petani)
            )
            .where(
                DemandRequest.buyer_id == current_user.id,
                DemandRequest.quantity_kg_committed > 0
            )
            .order_by(DemandRequest.created_at.desc())
        )
    elif current_user.role == UserRole.PETANI:
        stmt = (
            select(DemandRequest)
            .options(
                joinedload(DemandRequest.buyer),
                selectinload(DemandRequest.commitments).selectinload(SupplyCommitment.petani)
            )
            .where(
                DemandRequest.commitments.any(SupplyCommitment.petani_id == current_user.id)
            )
            .order_by(DemandRequest.created_at.desc())
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role tidak valid"
        )

    res = await db.execute(stmt)
    records = res.scalars().all()

    items = []
    for req in records:
        commits = []
        for c in req.commitments:
            commits.append({
                "id": c.id,
                "quantity_kg_committed": c.quantity_kg_committed,
                "committed_at": c.committed_at,
                "petani_name": c.petani.full_name if c.petani else None,
                "petani_phone": c.petani.phone_whatsapp if c.petani else None
            })
        
        petani_ids = {c.petani_id for c in req.commitments}
        num_petani = len(petani_ids)

        has_petani_rated = False
        if current_user.role == UserRole.PETANI:
            stmt_r = select(Rating).where(
                Rating.reference_id == req.id,
                Rating.transaction_type == TransactionType.DEMAND_FULFILLMENT,
                Rating.rater_id == current_user.id
            )
            res_r = await db.execute(stmt_r)
            has_petani_rated = res_r.scalar_one_or_none() is not None

        items.append({
            "id": req.id,
            "buyer_id": req.buyer_id,
            "buyer_name": req.buyer.full_name if req.buyer else None,
            "buyer_phone": req.buyer.phone_whatsapp if req.buyer else None,
            "buyer_rating_avg": req.buyer.buyer_rating_avg if req.buyer else None,
            "buyer_rating_count": req.buyer.buyer_rating_count if req.buyer else 0,
            "commodity_name": req.commodity_name,
            "category": req.category,
            "quantity_kg_needed": req.quantity_kg_needed,
            "quantity_kg_committed": req.quantity_kg_committed,
            "deadline": req.deadline,
            "status": req.status,
            "created_at": req.created_at,
            "commitments": commits,
            "num_petani_committed": num_petani,
            "has_petani_rated": has_petani_rated
        })
    return items

PROVINCE_CENTROIDS = {
    'Aceh': (4.6951, 96.7494),
    'Bali': (-8.4095, 115.1889),
    'Banten': (-6.4058, 106.0600),
    'Bengkulu': (-3.7928, 102.2608),
    'Di Yogyakarta': (-7.8753, 110.4262),
    'Gorontalo': (0.6999, 122.4556),
    'Jambi': (-1.6116, 103.6060),
    'Jawa Barat': (-7.0909, 107.6689),
    'Jawa Tengah': (-7.1510, 110.1403),
    'Jawa Timur': (-7.5360, 112.2384),
    'Kalimantan Barat': (-0.2789, 111.4753),
    'Kalimantan Selatan': (-3.0926, 115.2838),
    'Kalimantan Tengah': (-1.6814, 113.3824),
    'Kalimantan Timur': (1.6406, 116.4194),
    'Kalimantan Utara': (3.0731, 116.0414),
    'Kepulauan Bangka Belitung': (-2.7410, 106.4406),
    'Kepulauan Riau': (3.9456, 108.1428),
    'Lampung': (-4.5586, 105.4000),
    'Maluku': (-3.2384, 130.1453),
    'Maluku Utara': (1.5700, 127.8000),
    'Nusa Tenggara Barat': (-8.6529, 117.3616),
    'Nusa Tenggara Timur': (-8.6574, 121.0794),
    'Papua': (-4.2699, 138.0804),
    'Papua Barat': (-1.3361, 132.9000),
    'Riau': (0.5071, 101.5408),
    'Sulawesi Barat': (-2.8441, 119.3324),
    'Sulawesi Selatan': (-3.6687, 119.9741),
    'Sulawesi Tengah': (-1.4300, 121.4456),
    'Sulawesi Tenggara': (-4.1449, 122.1746),
    'Sulawesi Utara': (0.6247, 123.9750),
    'Sumatera Barat': (-0.7399, 100.8000),
    'Sumatera Selatan': (-3.3194, 103.9144),
    'Sumatera Utara': (2.1153, 99.5450),
    'DKI Jakarta': (-6.2088, 106.8456)
}

def get_closest_province(lat: float, lng: float) -> str:
    closest_prov = 'Di Yogyakarta'
    min_dist = float('inf')
    for prov_name, coords in PROVINCE_CENTROIDS.items():
        dist = ((coords[0] - lat) ** 2 + (coords[1] - lng) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest_prov = prov_name
    return closest_prov

from app.schemas.demand_request import DemandRegionalAnalyticsResponse

@router.get("/analytics/gap", response_model=DemandRegionalAnalyticsResponse)
async def get_regional_demand_gap(
    commodity_name: str = Query(..., description="Nama komoditas, misal Cabai Rawit Merah"),
    latitude: float = Query(-7.7956, description="Latitude lokasi petani"),
    longitude: float = Query(110.3695, description="Longitude lokasi petani"),
    db: AsyncSession = Depends(get_db)
):
    farmer_province = get_closest_province(latitude, longitude)
    
    from sqlalchemy.orm import joinedload
    stmt = select(
        DemandRequest,
        func.ST_Y(DemandRequest.location).label("latitude"),
        func.ST_X(DemandRequest.location).label("longitude")
    ).options(
        joinedload(DemandRequest.buyer)
    ).where(
        DemandRequest.status == DemandRequestStatus.TERBUKA,
        func.lower(DemandRequest.commodity_name).like(f"%{commodity_name.lower()}%")
    )
    
    res = await db.execute(stmt)
    rows = res.all()
    
    regional_requests = []
    total_needed = 0.0
    total_committed = 0.0
    
    for row in rows:
        dr = row[0]
        lat = row[1]
        lng = row[2]
        
        if lat is not None and lng is not None:
            prov = get_closest_province(lat, lng)
            if prov == farmer_province:
                total_needed += dr.quantity_kg_needed
                total_committed += dr.quantity_kg_committed
                
                regional_requests.append({
                    "id": dr.id,
                    "buyer_id": dr.buyer_id,
                    "commodity_name": dr.commodity_name,
                    "category": dr.category,
                    "quantity_kg_needed": dr.quantity_kg_needed,
                    "quantity_kg_committed": dr.quantity_kg_committed,
                    "price_per_kg": dr.price_per_kg,
                    "deadline": dr.deadline,
                    "status": dr.status,
                    "created_at": dr.created_at,
                    "latitude": lat,
                    "longitude": lng,
                    "buyer_name": dr.buyer.full_name if dr.buyer else None,
                    "buyer_rating_avg": dr.buyer.buyer_rating_avg if dr.buyer else 0.0,
                    "buyer_rating_count": dr.buyer.buyer_rating_count if dr.buyer else 0
                })
                
    ratio = (total_committed / total_needed * 100) if total_needed > 0 else 0.0
    
    if total_needed == 0:
        gap_status = "PELUANG_TINGGI"
    elif ratio < 50.0:
        gap_status = "PELUANG_TINGGI"
    elif ratio < 90.0:
        gap_status = "SEIMBANG"
    else:
        gap_status = "JENUH"
        
    return {
        "commodity_name": commodity_name,
        "province": farmer_province,
        "total_needed_kg": total_needed,
        "total_committed_kg": total_committed,
        "num_requests": len(regional_requests),
        "fulfillment_ratio": ratio,
        "status": gap_status,
        "open_requests": regional_requests
    }

@router.get("/{id}", response_model=DemandRequestDetailResponse)
async def get_demand_request_detail(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(auth_service.get_optional_current_user)
):
    from sqlalchemy.orm import joinedload
    stmt = select(
        DemandRequest,
        func.ST_Y(DemandRequest.location).label("latitude"),
        func.ST_X(DemandRequest.location).label("longitude")
    ).options(
        joinedload(DemandRequest.buyer)
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
    stmt_commitments = select(SupplyCommitment).options(
        joinedload(SupplyCommitment.petani)
    ).where(
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
        "committed_at": c.committed_at,
        "petani_name": c.petani.full_name if c.petani else None,
        "petani_phone": c.petani.phone_whatsapp if c.petani else None
    } for c in commitments]

    has_petani_rated = False
    if current_user and current_user.role == UserRole.PETANI:
        stmt_r = select(Rating).where(
            Rating.reference_id == id,
            Rating.transaction_type == TransactionType.DEMAND_FULFILLMENT,
            Rating.rater_id == current_user.id
        )
        res_r = await db.execute(stmt_r)
        has_petani_rated = res_r.scalar_one_or_none() is not None

    return {
        "id": request.id,
        "buyer_id": request.buyer_id,
        "buyer_name": request.buyer.full_name if request.buyer else None,
        "buyer_phone": request.buyer.phone_whatsapp if request.buyer else None,
        "buyer_rating_avg": request.buyer.buyer_rating_avg if request.buyer else None,
        "buyer_rating_count": request.buyer.buyer_rating_count if request.buyer else 0,
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
        "num_petani_committed": num_petani,
        "has_petani_rated": has_petani_rated
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
