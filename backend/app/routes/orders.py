from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List
import math
from decimal import Decimal
from datetime import datetime

from app.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import InventoryTransaction
from app.models.sale import Sale
from app.models.user import User
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse, OrderDetailResponse, OrderItemResponse, CustomerBrief
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def format_order_summary(order: Order) -> OrderResponse:
    customer_name = order.customer.name if order.customer else None
    customer_phone = order.customer.phone if order.customer else None
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        total_amount=order.total_amount,
        discount=order.discount,
        items_count=len(order.items),
        payment_status=order.payment_status,
        order_status=order.order_status,
        shipping_address=order.shipping_address,
        created_at=order.created_at,
        updated_at=order.updated_at
    )

@router.get("", response_model=PaginatedResponse[OrderResponse])
def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    """Retrieves paginated list of orders with customer info, status filters, and search."""
    query = db.query(Order).join(Order.customer).options(joinedload(Order.customer), joinedload(Order.items))

    if search:
        s = f"%{search}%"
        # If numeric search, could be order ID
        filters = [Customer.name.ilike(s), Customer.phone.ilike(s), Customer.email.ilike(s)]
        if search.isdigit():
            filters.append(Order.id == int(search))
        query = query.filter(or_(*filters))

    if order_status:
        query = query.filter(Order.order_status.ilike(order_status))

    if payment_status:
        query = query.filter(Order.payment_status.ilike(payment_status))

    sort_col = getattr(Order, sort_by, Order.created_at)
    if order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    orders = query.offset(offset).limit(limit).all()

    items = [format_order_summary(o) for o in orders]

    return PaginatedResponse(
        success=True,
        message="Orders retrieved successfully",
        data=items,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.get("/{order_id}", response_model=ApiResponse[OrderDetailResponse])
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Retrieves complete order details including customer data and item lines."""
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product)
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_response = []
    for item in order.items:
        prod = item.product
        subtotal = item.price * item.quantity
        items_response.append(
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=prod.name if prod else "Unknown Product",
                product_sku=prod.sku if prod else "",
                product_image=prod.image_url if prod else None,
                quantity=item.quantity,
                price=item.price,
                subtotal=subtotal,
                created_at=item.created_at
            )
        )

    customer_brief = None
    if order.customer:
        customer_brief = CustomerBrief(
            id=order.customer.id,
            name=order.customer.name,
            phone=order.customer.phone,
            email=order.customer.email
        )

    detail = OrderDetailResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else None,
        customer_phone=order.customer.phone if order.customer else None,
        total_amount=order.total_amount,
        discount=order.discount,
        items_count=len(order.items),
        payment_status=order.payment_status,
        order_status=order.order_status,
        shipping_address=order.shipping_address or (order.customer.address if order.customer else ""),
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=customer_brief,
        items=items_response
    )

    return ApiResponse(
        success=True,
        message="Order details retrieved successfully",
        data=detail
    )

@router.post("", response_model=ApiResponse[OrderDetailResponse])
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))
):
    """Creates a new order, calculates totals, deducts stock, and logs inventory & sales."""
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Validate products and stock
    total_amount = Decimal("0.00")
    order_items_to_add = []
    product_updates = []

    for item_in in order_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item_in.product_id} not found")

        if product.stock_quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product '{product.name}'. Available: {product.stock_quantity}, Requested: {item_in.quantity}"
            )

        unit_price = item_in.price if item_in.price is not None else product.price
        # Apply product discount if applicable
        if product.discount > 0:
            discount_amount = unit_price * (product.discount / Decimal("100"))
            unit_price = unit_price - discount_amount

        line_subtotal = unit_price * item_in.quantity
        total_amount += line_subtotal

        order_items_to_add.append((product, item_in.quantity, unit_price, line_subtotal))

    # Apply overall order discount
    final_total = max(Decimal("0.00"), total_amount - order_in.discount)

    shipping_addr = order_in.shipping_address or customer.address or f"{customer.city or ''} {customer.state or ''}".strip()

    # Create Order
    new_order = Order(
        customer_id=customer.id,
        total_amount=final_total,
        discount=order_in.discount,
        payment_status=order_in.payment_status,
        order_status=order_in.order_status,
        shipping_address=shipping_addr
    )
    db.add(new_order)
    db.flush()  # assign new_order.id

    # Create OrderItems, deduct stock, create InventoryTransaction and Sale
    for prod, qty, price, line_total in order_items_to_add:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=prod.id,
            quantity=qty,
            price=price
        )
        db.add(order_item)

        # Deduct stock
        prev_qty = prod.stock_quantity
        prod.stock_quantity = prev_qty - qty

        # Inventory transaction
        inv_tx = InventoryTransaction(
            product_id=prod.id,
            transaction_type="Sale",
            quantity=-qty,
            previous_quantity=prev_qty,
            new_quantity=prod.stock_quantity,
            reason=f"Sale order #{new_order.id}"
        )
        db.add(inv_tx)

        # Record Sale
        sale_entry = Sale(
            order_id=new_order.id,
            product_id=prod.id,
            quantity=qty,
            amount=line_total,
            sale_date=datetime.now()
        )
        db.add(sale_entry)

    db.commit()
    db.refresh(new_order)

    return get_order(new_order.id, db)

@router.put("/{order_id}/status", response_model=ApiResponse[OrderDetailResponse])
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "STAFF"]))
):
    """Updates order status or payment status. Restores stock if order is cancelled."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.order_status

    if status_in.order_status:
        new_status = status_in.order_status
        # If transitioning to Cancelled from a non-cancelled state, restore stock
        if new_status.lower() == "cancelled" and old_status.lower() != "cancelled":
            for item in order.items:
                prod = item.product
                if prod:
                    prev_qty = prod.stock_quantity
                    prod.stock_quantity = prev_qty + item.quantity
                    inv_tx = InventoryTransaction(
                        product_id=prod.id,
                        transaction_type="Return",
                        quantity=item.quantity,
                        previous_quantity=prev_qty,
                        new_quantity=prod.stock_quantity,
                        reason=f"Order #{order.id} cancelled - stock restored"
                    )
                    db.add(inv_tx)
        order.order_status = new_status

    if status_in.payment_status:
        order.payment_status = status_in.payment_status

    db.commit()
    db.refresh(order)

    return get_order(order.id, db)

@router.delete("/{order_id}", response_model=ApiResponse[dict])
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """Deletes an order (Admin only)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
    return ApiResponse(
        success=True,
        message="Order deleted successfully",
        data={"id": order_id}
    )
