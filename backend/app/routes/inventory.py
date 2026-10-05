from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List
import math
from decimal import Decimal

from app.database import get_db
from app.models.product import Product
from app.models.inventory import InventoryTransaction
from app.models.user import User
from app.schemas.inventory import InventoryAdjustRequest, InventoryTransactionResponse, InventorySummaryResponse
from app.schemas.product import ProductResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta
from app.auth import get_current_user, require_roles
from app.routes.products import format_product_response

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/summary", response_model=ApiResponse[InventorySummaryResponse])
def get_inventory_summary(db: Session = Depends(get_db)):
    """Retrieves high-level summary cards for the inventory management screen."""
    products = db.query(Product).all()
    total_products = len(products)
    available_count = 0
    low_stock_count = 0
    out_of_stock_count = 0
    total_valuation = 0.0

    for p in products:
        total_valuation += float(p.price) * p.stock_quantity
        if p.stock_quantity <= 0:
            out_of_stock_count += 1
        elif p.stock_quantity <= p.minimum_stock_level:
            low_stock_count += 1
        else:
            available_count += 1

    return ApiResponse(
        success=True,
        message="Inventory summary retrieved",
        data=InventorySummaryResponse(
            total_products=total_products,
            available_stock_count=available_count,
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count,
            total_inventory_valuation=round(total_valuation, 2)
        )
    )

@router.get("", response_model=PaginatedResponse[ProductResponse])
def get_inventory_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,  # all, available, low_stock, out_of_stock
    db: Session = Depends(get_db)
):
    """Retrieves inventory status for products with pagination and filters."""
    query = db.query(Product).options(joinedload(Product.category))

    if search:
        s = f"%{search}%"
        query = query.filter(or_(Product.name.ilike(s), Product.sku.ilike(s)))

    if status_filter:
        sf = status_filter.lower().replace("-", "_").replace(" ", "_")
        if sf == "out_of_stock":
            query = query.filter(Product.stock_quantity <= 0)
        elif sf == "low_stock":
            query = query.filter(
                Product.stock_quantity > 0,
                Product.stock_quantity <= Product.minimum_stock_level
            )
        elif sf == "available":
            query = query.filter(Product.stock_quantity > Product.minimum_stock_level)

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    products = query.order_by(Product.stock_quantity.asc()).offset(offset).limit(limit).all()

    items = [format_product_response(p) for p in products]

    return PaginatedResponse(
        success=True,
        message="Inventory records retrieved",
        data=items,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.get("/low-stock", response_model=ApiResponse[List[ProductResponse]])
def get_low_stock(db: Session = Depends(get_db)):
    """Retrieves all products that have low stock (<= minimum_stock_level)."""
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(
            Product.stock_quantity > 0,
            Product.stock_quantity <= Product.minimum_stock_level
        )
        .order_by(Product.stock_quantity.asc())
        .all()
    )
    return ApiResponse(
        success=True,
        message="Low stock items retrieved",
        data=[format_product_response(p) for p in products]
    )

@router.get("/out-of-stock", response_model=ApiResponse[List[ProductResponse]])
def get_out_of_stock(db: Session = Depends(get_db)):
    """Retrieves all products with zero stock."""
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.stock_quantity <= 0)
        .order_by(Product.name.asc())
        .all()
    )
    return ApiResponse(
        success=True,
        message="Out of stock items retrieved",
        data=[format_product_response(p) for p in products]
    )

@router.get("/transactions", response_model=PaginatedResponse[InventoryTransactionResponse])
def get_inventory_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieves paginated audit log of all inventory transactions."""
    query = db.query(InventoryTransaction).join(InventoryTransaction.product).options(joinedload(InventoryTransaction.product))

    if product_id:
        query = query.filter(InventoryTransaction.product_id == product_id)

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    transactions = query.order_by(InventoryTransaction.created_at.desc()).offset(offset).limit(limit).all()

    items = [
        InventoryTransactionResponse(
            id=t.id,
            product_id=t.product_id,
            product_name=t.product.name if t.product else "Deleted Product",
            product_sku=t.product.sku if t.product else "",
            transaction_type=t.transaction_type,
            quantity=t.quantity,
            previous_quantity=t.previous_quantity,
            new_quantity=t.new_quantity,
            reason=t.reason,
            created_at=t.created_at
        )
        for t in transactions
    ]

    return PaginatedResponse(
        success=True,
        message="Inventory transactions retrieved",
        data=items,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.put("/{product_id}", response_model=ApiResponse[ProductResponse])
def adjust_inventory_stock(
    product_id: int,
    adjust_in: InventoryAdjustRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Adjusts stock for a specific product and records an audit transaction."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    prev = product.stock_quantity
    op = adjust_in.operation.lower()
    qty = adjust_in.quantity

    if op == "add":
        new_qty = prev + qty
        delta = qty
        tx_type = "Purchase" if "purchase" in (adjust_in.reason or "").lower() else "Adjustment"
    elif op == "subtract":
        if prev < qty:
            raise HTTPException(status_code=400, detail="Cannot reduce stock below 0")
        new_qty = prev - qty
        delta = -qty
        tx_type = "Damage" if "damage" in (adjust_in.reason or "").lower() else "Adjustment"
    elif op == "set":
        new_qty = qty
        delta = new_qty - prev
        tx_type = "Adjustment"
    else:
        raise HTTPException(status_code=400, detail="Operation must be 'add', 'subtract', or 'set'")

    product.stock_quantity = new_qty
    tx = InventoryTransaction(
        product_id=product.id,
        transaction_type=tx_type,
        quantity=delta,
        previous_quantity=prev,
        new_quantity=new_qty,
        reason=adjust_in.reason or f"Stock {op} by {current_user.name}"
    )
    db.add(tx)
    db.commit()
    db.refresh(product)

    return ApiResponse(
        success=True,
        message="Inventory adjusted successfully",
        data=format_product_response(product)
    )
