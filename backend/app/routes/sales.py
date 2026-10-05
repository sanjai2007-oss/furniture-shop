from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import math

from app.database import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.schemas.sale import SaleResponse, SalesSummaryPeriod, DailySalesChartItem, CategorySalesChartItem
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedMeta

router = APIRouter(prefix="/api/sales", tags=["Sales"])

@router.get("", response_model=PaginatedResponse[SaleResponse])
def get_sales(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves paginated list of sales transactions."""
    query = (
        db.query(Sale)
        .join(Sale.product)
        .options(
            joinedload(Sale.product).joinedload(Product.category)
        )
    )

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    sales = query.order_by(Sale.sale_date.desc()).offset(offset).limit(limit).all()

    items = []
    for s in sales:
        prod = s.product
        cat_name = prod.category.name if prod and prod.category else "Uncategorized"
        items.append(
            SaleResponse(
                id=s.id,
                order_id=s.order_id,
                product_id=s.product_id,
                product_name=prod.name if prod else "Unknown",
                product_image=prod.image_url if prod else None,
                category_name=cat_name,
                quantity=s.quantity,
                amount=s.amount,
                sale_date=s.sale_date,
                created_at=s.created_at
            )
        )

    return PaginatedResponse(
        success=True,
        message="Sales transactions retrieved",
        data=items,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.get("/summary", response_model=ApiResponse[SalesSummaryPeriod])
def get_sales_summary(db: Session = Depends(get_db)):
    """Calculates revenue for Today, This Week, This Month, This Year, and Lifetime."""
    now = datetime.now()
    start_today = datetime(now.year, now.month, now.day)
    start_week = start_today - timedelta(days=now.weekday())
    start_month = datetime(now.year, now.month, 1)
    start_year = datetime(now.year, 1, 1)

    today_sales = db.query(func.coalesce(func.sum(Sale.amount), 0)).filter(Sale.sale_date >= start_today).scalar() or 0
    week_sales = db.query(func.coalesce(func.sum(Sale.amount), 0)).filter(Sale.sale_date >= start_week).scalar() or 0
    month_sales = db.query(func.coalesce(func.sum(Sale.amount), 0)).filter(Sale.sale_date >= start_month).scalar() or 0
    year_sales = db.query(func.coalesce(func.sum(Sale.amount), 0)).filter(Sale.sale_date >= start_year).scalar() or 0
    total_sales = db.query(func.coalesce(func.sum(Sale.amount), 0)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    return ApiResponse(
        success=True,
        message="Sales summary retrieved",
        data=SalesSummaryPeriod(
            today=Decimal(str(today_sales)),
            this_week=Decimal(str(week_sales)),
            this_month=Decimal(str(month_sales)),
            this_year=Decimal(str(year_sales)),
            total_sales=Decimal(str(total_sales)),
            total_orders=total_orders
        )
    )

@router.get("/monthly", response_model=ApiResponse[List[DailySalesChartItem]])
def get_monthly_sales_trend(db: Session = Depends(get_db)):
    """Retrieves 30-day daily sales history for trend charts."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    # Fetch daily aggregated data
    sales_records = (
        db.query(Sale)
        .filter(Sale.sale_date >= start_date)
        .order_by(Sale.sale_date.asc())
        .all()
    )

    day_map = {}
    for i in range(30):
        day_str = (start_date + timedelta(days=i + 1)).strftime("%b %d")
        day_map[day_str] = {"revenue": 0.0, "orders": set()}

    for s in sales_records:
        day_key = s.sale_date.strftime("%b %d")
        if day_key in day_map:
            day_map[day_key]["revenue"] += float(s.amount)
            day_map[day_key]["orders"].add(s.order_id)

    trend = [
        DailySalesChartItem(
            date=d,
            revenue=round(val["revenue"], 2),
            orders_count=len(val["orders"])
        )
        for d, val in day_map.items()
    ]

    return ApiResponse(
        success=True,
        message="Daily sales trend retrieved",
        data=trend
    )

@router.get("/by-category", response_model=ApiResponse[List[CategorySalesChartItem]])
def get_sales_by_category(db: Session = Depends(get_db)):
    """Calculates revenue and unit volume breakdown across furniture categories."""
    results = (
        db.query(
            Category.name.label("cat_name"),
            func.coalesce(func.sum(Sale.amount), 0).label("revenue"),
            func.coalesce(func.sum(Sale.quantity), 0).label("units")
        )
        .join(Product, Product.category_id == Category.id)
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Category.id, Category.name)
        .order_by(func.sum(Sale.amount).desc())
        .all()
    )

    data = [
        CategorySalesChartItem(
            category_name=r.cat_name,
            total_revenue=float(r.revenue),
            units_sold=int(r.units)
        )
        for r in results
    ]

    return ApiResponse(
        success=True,
        message="Category sales breakdown retrieved",
        data=data
    )
