from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    price: Optional[Decimal] = None  # If not provided, fetch current product price

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    product_image: Optional[str] = None
    quantity: int
    price: Decimal
    subtotal: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_status: str = "Pending"  # Pending, Paid, Partially Paid, Refunded
    order_status: str = "Pending"  # Pending, Confirmed, Processing, Shipped, Delivered, Cancelled
    shipping_address: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None

class CustomerBrief(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    total_amount: Decimal
    discount: Decimal
    items_count: Optional[int] = 0
    payment_status: str
    order_status: str
    shipping_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderDetailResponse(OrderResponse):
    customer: Optional[CustomerBrief] = None
    items: List[OrderItemResponse] = []
