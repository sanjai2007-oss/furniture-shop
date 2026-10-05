from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ReportOverview(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    total_items_sold: int
    top_category: Optional[str] = None

class ReportChartItem(BaseModel):
    name: str
    value: float
    secondary_value: Optional[float] = 0.0

class FullReportResponse(BaseModel):
    overview: ReportOverview
    revenue_chart: List[ReportChartItem]
    category_chart: List[ReportChartItem]
    top_products_chart: List[ReportChartItem]
    order_status_chart: List[ReportChartItem]
