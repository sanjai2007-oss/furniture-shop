from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.order import OrderResponse

class KPICards(BaseModel):
    total_sales: float
    total_sales_change_pct: float
    total_orders: int
    total_orders_change_pct: float
    total_products: int
    total_products_change_pct: float
    total_customers: int
    total_customers_change_pct: float

class SalesChartPoint(BaseModel):
    label: str
    sales: float
    orders: int

class TopProductItem(BaseModel):
    id: int
    name: str
    category: str
    image_url: Optional[str] = None
    units_sold: int
    revenue: float

class LowStockAlertItem(BaseModel):
    id: int
    name: str
    category: str
    sku: str
    stock_quantity: int
    minimum_stock_level: int
    image_url: Optional[str] = None
    status: str

class RecentActivityItem(BaseModel):
    id: str
    type: str  # order, product, stock, customer
    title: str
    description: str
    timestamp: datetime
    badge_color: Optional[str] = "primary"

class DashboardSummaryResponse(BaseModel):
    kpi: KPICards
    sales_overview: List[SalesChartPoint]
    recent_orders: List[OrderResponse]
    top_products: List[TopProductItem]
    low_stock_alerts: List[LowStockAlertItem]
    recent_activity: List[RecentActivityItem]
