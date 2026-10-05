from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
import math
from decimal import Decimal

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/customers", tags=["Customers"])

def enrich_customer(cust: Customer, db: Session) -> CustomerResponse:
    # Aggregated stats
    stats = (
        db.query(
            func.count(Order.id).label("orders_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_spent"),
            func.max(Order.created_at).label("last_order")
        )
        .filter(Order.customer_id == cust.id)
        .first()
    )

    orders_count = stats.orders_count if stats else 0
    total_spent = Decimal(str(stats.total_spent)) if stats and stats.total_spent else Decimal("0.00")
    last_order_date = stats.last_order if stats else None

    return CustomerResponse(
        id=cust.id,
        name=cust.name,
        phone=cust.phone,
        email=cust.email,
        address=cust.address,
        city=cust.city,
        state=cust.state,
        pincode=cust.pincode,
        created_at=cust.created_at,
        updated_at=cust.updated_at,
        orders_count=orders_count,
        total_spent=total_spent,
        last_order_date=last_order_date
    )

@router.get("", response_model=PaginatedResponse[CustomerResponse])
def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    """Retrieves paginated list of customers with search and calculated spending stats."""
    query = db.query(Customer)

    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Customer.name.ilike(s),
                Customer.phone.ilike(s),
                Customer.email.ilike(s),
                Customer.city.ilike(s)
            )
        )

    sort_col = getattr(Customer, sort_by, Customer.created_at)
    if order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    customers = query.offset(offset).limit(limit).all()

    enriched = [enrich_customer(c, db) for c in customers]

    return PaginatedResponse(
        success=True,
        message="Customers retrieved successfully",
        data=enriched,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.get("/{customer_id}", response_model=ApiResponse[dict])
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Retrieves single customer details along with past orders."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    cust_enriched = enrich_customer(customer, db).model_dump()
    orders = (
        db.query(Order)
        .filter(Order.customer_id == customer_id)
        .order_by(Order.created_at.desc())
        .limit(20)
        .all()
    )

    orders_data = [
        {
            "id": o.id,
            "total_amount": float(o.total_amount),
            "discount": float(o.discount),
            "payment_status": o.payment_status,
            "order_status": o.order_status,
            "created_at": o.created_at,
            "items_count": len(o.items)
        }
        for o in orders
    ]
    cust_enriched["orders"] = orders_data

    return ApiResponse(
        success=True,
        message="Customer details retrieved successfully",
        data=cust_enriched
    )

@router.post("", response_model=ApiResponse[CustomerResponse])
def create_customer(
    cust_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))
):
    """Creates a new customer."""
    if cust_in.email:
        existing = db.query(Customer).filter(Customer.email == cust_in.email.lower()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this email already exists")

    customer = Customer(
        name=cust_in.name,
        phone=cust_in.phone,
        email=cust_in.email.lower() if cust_in.email else None,
        address=cust_in.address,
        city=cust_in.city,
        state=cust_in.state,
        pincode=cust_in.pincode
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    return ApiResponse(
        success=True,
        message="Customer created successfully",
        data=enrich_customer(customer, db)
    )

@router.put("/{customer_id}", response_model=ApiResponse[CustomerResponse])
def update_customer(
    customer_id: int,
    cust_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))
):
    """Updates an existing customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if cust_in.email:
        duplicate = db.query(Customer).filter(
            Customer.email == cust_in.email.lower(),
            Customer.id != customer_id
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Customer with this email already exists")
        customer.email = cust_in.email.lower()

    if cust_in.name is not None:
        customer.name = cust_in.name
    if cust_in.phone is not None:
        customer.phone = cust_in.phone
    if cust_in.address is not None:
        customer.address = cust_in.address
    if cust_in.city is not None:
        customer.city = cust_in.city
    if cust_in.state is not None:
        customer.state = cust_in.state
    if cust_in.pincode is not None:
        customer.pincode = cust_in.pincode

    db.commit()
    db.refresh(customer)
    return ApiResponse(
        success=True,
        message="Customer updated successfully",
        data=enrich_customer(customer, db)
    )

@router.delete("/{customer_id}", response_model=ApiResponse[dict])
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Deletes a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return ApiResponse(
        success=True,
        message="Customer deleted successfully",
        data={"id": customer_id}
    )
