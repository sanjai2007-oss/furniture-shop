from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
import math

from app.database import get_db
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("", response_model=PaginatedResponse[SupplierResponse])
def get_suppliers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: str = Query("name"),
    order: str = Query("asc"),
    db: Session = Depends(get_db)
):
    """Retrieves paginated suppliers directory with search."""
    query = db.query(Supplier)

    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Supplier.name.ilike(s),
                Supplier.contact_person.ilike(s),
                Supplier.phone.ilike(s),
                Supplier.email.ilike(s),
                Supplier.city.ilike(s)
            )
        )

    sort_col = getattr(Supplier, sort_by, Supplier.name)
    if order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    suppliers = query.offset(offset).limit(limit).all()

    items = [SupplierResponse.model_validate(s) for s in suppliers]

    return PaginatedResponse(
        success=True,
        message="Suppliers retrieved successfully",
        data=items,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.get("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Retrieves single supplier information."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return ApiResponse(
        success=True,
        message="Supplier details retrieved",
        data=SupplierResponse.model_validate(supplier)
    )

@router.post("", response_model=ApiResponse[SupplierResponse])
def create_supplier(
    supp_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Creates a new supplier."""
    supplier = Supplier(
        name=supp_in.name,
        contact_person=supp_in.contact_person,
        phone=supp_in.phone,
        email=supp_in.email.lower() if supp_in.email else None,
        address=supp_in.address,
        city=supp_in.city
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return ApiResponse(
        success=True,
        message="Supplier created successfully",
        data=SupplierResponse.model_validate(supplier)
    )

@router.put("/{supplier_id}", response_model=ApiResponse[SupplierResponse])
def update_supplier(
    supplier_id: int,
    supp_in: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Updates supplier information."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    if supp_in.name is not None:
        supplier.name = supp_in.name
    if supp_in.contact_person is not None:
        supplier.contact_person = supp_in.contact_person
    if supp_in.phone is not None:
        supplier.phone = supp_in.phone
    if supp_in.email is not None:
        supplier.email = supp_in.email.lower() if supp_in.email else None
    if supp_in.address is not None:
        supplier.address = supp_in.address
    if supp_in.city is not None:
        supplier.city = supp_in.city

    db.commit()
    db.refresh(supplier)
    return ApiResponse(
        success=True,
        message="Supplier updated successfully",
        data=SupplierResponse.model_validate(supplier)
    )

@router.delete("/{supplier_id}", response_model=ApiResponse[dict])
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """Deletes a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()
    return ApiResponse(
        success=True,
        message="Supplier deleted successfully",
        data={"id": supplier_id}
    )
