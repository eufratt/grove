from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from app.models.demand_request import DemandRequestStatus

class DemandRequestCreate(BaseModel):
    commodity_name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=100)
    quantity_kg_needed: float = Field(..., gt=0)
    deadline: datetime
    latitude: float
    longitude: float

class DemandCommitmentCreate(BaseModel):
    quantity_kg: float = Field(..., gt=0)

class SupplyCommitmentSummary(BaseModel):
    id: UUID
    quantity_kg_committed: float
    committed_at: datetime
    petani_name: Optional[str] = None
    petani_phone: Optional[str] = None

    class Config:
        from_attributes = True

class DemandRequestResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    commodity_name: str
    category: str
    quantity_kg_needed: float
    quantity_kg_committed: float
    deadline: datetime
    status: DemandRequestStatus
    created_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class DemandRequestDetailResponse(DemandRequestResponse):
    buyer_name: Optional[str] = None
    buyer_phone: Optional[str] = None
    commitments: List[SupplyCommitmentSummary] = []
    num_petani_committed: int = 0

    class Config:
        from_attributes = True
