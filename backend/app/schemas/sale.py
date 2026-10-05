from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class SaleResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    category_name: Optional[str] = None
    quantity: int
    amount: Decimal
    sale_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class SalesSummaryPeriod(BaseModel):
    today: Decimal
    this_week: Decimal
    this_month: Decimal
    this_year: Decimal
    total_sales: Decimal
    total_orders: int

class DailySalesChartItem(BaseModel):
    date: str
    revenue: float
    orders_count: int

class CategorySalesChartItem(BaseModel):
    category_name: str
    total_revenue: float
    units_sold: int
