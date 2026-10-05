from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List
import math
from decimal import Decimal

from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import InventoryTransaction
from app.models.sale import Sale
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductStockUpdate, ProductResponse, ProductCategoryBrief
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta
from app.schemas.inventory import InventoryTransactionResponse
from app.schemas.sale import SaleResponse
from app.auth import get_current_user, require_roles
from app.image_service import upload_image

router = APIRouter(prefix="/api/products", tags=["Products"])

def format_product_response(product: Product) -> ProductResponse:
    category_brief = None
    if product.category:
        category_brief = ProductCategoryBrief(id=product.category.id, name=product.category.name)
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        category_id=product.category_id,
        description=product.description,
        price=product.price,
        discount=product.discount,
        stock_quantity=product.stock_quantity,
        minimum_stock_level=product.minimum_stock_level,
        sku=product.sku,
        image_url=product.image_url,
        status=product.status,
        created_at=product.created_at,
        updated_at=product.updated_at,
        category=category_brief
    )

@router.get("", response_model=PaginatedResponse[ProductResponse])
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    stock_status: Optional[str] = None,  # Available, Low Stock, Out of Stock
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    """Retrieves paginated list of products with search and filtering."""
    query = db.query(Product).options(joinedload(Product.category))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.sku.ilike(search_filter),
                Product.description.ilike(search_filter)
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if stock_status:
        if stock_status.lower() == "out of stock":
            query = query.filter(Product.stock_quantity <= 0)
        elif stock_status.lower() == "low stock":
            query = query.filter(
                Product.stock_quantity > 0,
                Product.stock_quantity <= Product.minimum_stock_level
            )
        elif stock_status.lower() == "available":
            query = query.filter(Product.stock_quantity > Product.minimum_stock_level)

    # Sorting
    sort_column = getattr(Product, sort_by, Product.created_at)
    if order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    products = query.offset(offset).limit(limit).all()

    items = [format_product_response(p) for p in products]

    return PaginatedResponse(
        success=True,
        message="Products retrieved successfully",
        data=items,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.post("/upload-image", response_model=ApiResponse[dict])
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Uploads a product image to Cloudinary (or local server storage) and returns the public URL."""
    base_url = str(request.base_url)
    image_url = await upload_image(file, base_url=base_url)
    return ApiResponse(
        success=True,
        message="Image uploaded successfully",
        data={"url": image_url}
    )

@router.get("/{product_id}", response_model=ApiResponse[dict])
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Retrieves single product details including inventory transactions and sales history."""
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Inventory transactions
    transactions = (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id == product_id)
        .order_by(InventoryTransaction.created_at.desc())
        .limit(20)
        .all()
    )
    trans_data = [
        {
            "id": t.id,
            "transaction_type": t.transaction_type,
            "quantity": t.quantity,
            "previous_quantity": t.previous_quantity,
            "new_quantity": t.new_quantity,
            "reason": t.reason,
            "created_at": t.created_at
        }
        for t in transactions
    ]

    # Sales history
    sales = (
        db.query(Sale)
        .filter(Sale.product_id == product_id)
        .order_by(Sale.sale_date.desc())
        .limit(20)
        .all()
    )
    sales_data = [
        {
            "id": s.id,
            "order_id": s.order_id,
            "quantity": s.quantity,
            "amount": float(s.amount),
            "sale_date": s.sale_date
        }
        for s in sales
    ]

    product_dict = format_product_response(product).model_dump()
    product_dict["inventory_history"] = trans_data
    product_dict["sales_history"] = sales_data

    return ApiResponse(
        success=True,
        message="Product details retrieved successfully",
        data=product_dict
    )

@router.post("", response_model=ApiResponse[ProductResponse])
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Creates a new product with unique SKU and initial stock log."""
    existing_sku = db.query(Product).filter(Product.sku.ilike(product_in.sku)).first()
    if existing_sku:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")

    product = Product(
        name=product_in.name,
        category_id=product_in.category_id,
        description=product_in.description,
        price=product_in.price,
        discount=product_in.discount,
        stock_quantity=product_in.stock_quantity,
        minimum_stock_level=product_in.minimum_stock_level,
        sku=product_in.sku,
        image_url=product_in.image_url
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Initial inventory transaction if stock > 0
    if product.stock_quantity > 0:
        inv_tx = InventoryTransaction(
            product_id=product.id,
            transaction_type="Purchase",
            quantity=product.stock_quantity,
            previous_quantity=0,
            new_quantity=product.stock_quantity,
            reason="Initial inventory stock"
        )
        db.add(inv_tx)
        db.commit()

    return ApiResponse(
        success=True,
        message="Product created successfully",
        data=format_product_response(product)
    )

@router.put("/{product_id}", response_model=ApiResponse[ProductResponse])
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Updates an existing product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_in.sku is not None and product_in.sku != product.sku:
        duplicate = db.query(Product).filter(
            Product.sku.ilike(product_in.sku),
            Product.id != product_id
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Product with this SKU already exists")
        product.sku = product_in.sku

    if product_in.name is not None:
        product.name = product_in.name
    if product_in.category_id is not None:
        product.category_id = product_in.category_id
    if product_in.description is not None:
        product.description = product_in.description
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.discount is not None:
        product.discount = product_in.discount
    if product_in.minimum_stock_level is not None:
        product.minimum_stock_level = product_in.minimum_stock_level
    if product_in.image_url is not None:
        product.image_url = product_in.image_url

    # If stock_quantity changed directly
    if product_in.stock_quantity is not None and product_in.stock_quantity != product.stock_quantity:
        prev = product.stock_quantity
        diff = product_in.stock_quantity - prev
        product.stock_quantity = product_in.stock_quantity
        inv_tx = InventoryTransaction(
            product_id=product.id,
            transaction_type="Adjustment",
            quantity=diff,
            previous_quantity=prev,
            new_quantity=product_in.stock_quantity,
            reason="Direct product update"
        )
        db.add(inv_tx)

    db.commit()
    db.refresh(product)
    return ApiResponse(
        success=True,
        message="Product updated successfully",
        data=format_product_response(product)
    )

@router.put("/{product_id}/stock", response_model=ApiResponse[ProductResponse])
def update_product_stock(
    product_id: int,
    stock_in: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Adjusts stock for a product and creates an inventory transaction audit record."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    prev = product.stock_quantity
    operation = stock_in.operation.lower()
    qty = stock_in.quantity

    if operation == "add":
        new_qty = prev + qty
        tx_type = "Purchase" if "purchase" in (stock_in.reason or "").lower() else "Adjustment"
        delta = qty
    elif operation == "subtract":
        if prev < qty:
            raise HTTPException(status_code=400, detail="Cannot reduce stock below zero")
        new_qty = prev - qty
        tx_type = "Damage" if "damage" in (stock_in.reason or "").lower() else "Adjustment"
        delta = -qty
    elif operation == "set":
        new_qty = qty
        delta = new_qty - prev
        tx_type = "Adjustment"
    else:
        raise HTTPException(status_code=400, detail="Invalid operation. Must be 'add', 'subtract', or 'set'")

    product.stock_quantity = new_qty
    inv_tx = InventoryTransaction(
        product_id=product.id,
        transaction_type=tx_type,
        quantity=delta,
        previous_quantity=prev,
        new_quantity=new_qty,
        reason=stock_in.reason or "Stock level adjusted"
    )
    db.add(inv_tx)
    db.commit()
    db.refresh(product)

    return ApiResponse(
        success=True,
        message="Stock updated successfully",
        data=format_product_response(product)
    )

@router.delete("/{product_id}", response_model=ApiResponse[dict])
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """Deletes a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return ApiResponse(
        success=True,
        message="Product deleted successfully",
        data={"id": product_id}
    )
