from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryAdjustRequest(BaseModel):
    product_id: int
    operation: str = Field(..., description="'add', 'subtract', or 'set'")
    quantity: int = Field(..., ge=0)
    reason: Optional[str] = "Manual stock adjustment"

class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    transaction_type: str
    quantity: int
    previous_quantity: int
    new_quantity: int
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InventorySummaryResponse(BaseModel):
    total_products: int
    available_stock_count: int
    low_stock_count: int
    out_of_stock_count: int
    total_inventory_valuation: float
