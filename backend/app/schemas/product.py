from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    stock_quantity: int = Field(default=0, ge=0)
    minimum_stock_level: int = Field(default=5, ge=0)
    sku: str = Field(..., min_length=1, max_length=50)
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    minimum_stock_level: Optional[int] = None
    sku: Optional[str] = None
    image_url: Optional[str] = None

class ProductStockUpdate(BaseModel):
    quantity: int  # Delta or new quantity depending on endpoint
    operation: str = "set"  # set, add, subtract
    reason: Optional[str] = "Manual stock update"

class ProductCategoryBrief(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    category: Optional[ProductCategoryBrief] = None

    class Config:
        from_attributes = True
