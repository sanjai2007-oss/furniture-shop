from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta
import io

from app.database import get_db
from app.models.sale import Sale
from app.models.order import Order
from app.models.product import Product
from app.models.category import Category
from app.models.customer import Customer
from app.schemas.report import FullReportResponse, ReportOverview, ReportChartItem
from app.schemas.common import ApiResponse

# ReportLab imports for PDF export
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# openpyxl for Excel export
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/summary", response_model=ApiResponse[FullReportResponse])
def get_full_reports(db: Session = Depends(get_db)):
    """Computes comprehensive business intelligence data for the reports dashboard."""
    # 1. Overview metrics
    total_revenue = db.query(func.coalesce(func.sum(Sale.amount), 0)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_items = db.query(func.coalesce(func.sum(Sale.quantity), 0)).scalar() or 0
    avg_order_val = (total_revenue / total_orders) if total_orders > 0 else 0.0

    # Top category
    top_cat_row = (
        db.query(Category.name, func.sum(Sale.amount).label("rev"))
        .join(Product, Product.category_id == Category.id)
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Category.name)
        .order_by(func.sum(Sale.amount).desc())
        .first()
    )
    top_category = top_cat_row[0] if top_cat_row else "Living Room"

    overview = ReportOverview(
        total_revenue=float(total_revenue),
        total_orders=total_orders,
        average_order_value=round(float(avg_order_val), 2),
        total_items_sold=int(total_items),
        top_category=top_category
    )

    # 2. Revenue Chart (by month of the current year)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_rev_map = {m: 0.0 for m in months}
    sales = db.query(Sale).all()
    for s in sales:
        m_str = s.sale_date.strftime("%b")
        if m_str in monthly_rev_map:
            monthly_rev_map[m_str] += float(s.amount)

    revenue_chart = [ReportChartItem(name=m, value=round(val, 2)) for m, val in monthly_rev_map.items()]

    # 3. Category distribution
    cat_rows = (
        db.query(Category.name, func.sum(Sale.amount).label("rev"))
        .join(Product, Product.category_id == Category.id)
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Category.name)
        .all()
    )
    category_chart = [
        ReportChartItem(name=cr[0], value=round(float(cr[1]), 2))
        for cr in cat_rows
    ]

    # 4. Top 5 Products
    top_p_rows = (
        db.query(Product.name, func.sum(Sale.amount).label("rev"), func.sum(Sale.quantity).label("units"))
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.name)
        .order_by(func.sum(Sale.amount).desc())
        .limit(5)
        .all()
    )
    top_products_chart = [
        ReportChartItem(name=pr[0], value=round(float(pr[1]), 2), secondary_value=float(pr[2]))
        for pr in top_p_rows
    ]

    # 5. Order status breakdown
    status_rows = (
        db.query(Order.order_status, func.count(Order.id))
        .group_by(Order.order_status)
        .all()
    )
    order_status_chart = [
        ReportChartItem(name=sr[0], value=float(sr[1]))
        for sr in status_rows
    ]

    return ApiResponse(
        success=True,
        message="Reports overview retrieved",
        data=FullReportResponse(
            overview=overview,
            revenue_chart=revenue_chart,
            category_chart=category_chart,
            top_products_chart=top_products_chart,
            order_status_chart=order_status_chart
        )
    )

@router.get("/export/pdf")
def export_pdf_report(db: Session = Depends(get_db)):
    """Generates a professional PDF report containing furniture shop business metrics."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#4E3629')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#757575')
    )
    section_style = ParagraphStyle(
        'DocSection',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#4E3629')
    )

    elements = []
    # Header
    elements.append(Paragraph("FURNITURE SHOP MANAGEMENT SYSTEM", title_style))
    elements.append(Paragraph(f"Executive Business & Sales Report • Generated on {datetime.now().strftime('%d %B %Y, %I:%M %p')}", subtitle_style))
    elements.append(Spacer(1, 15))

    # Metrics summary
    total_rev = db.query(func.coalesce(func.sum(Sale.amount), 0)).scalar() or 0
    total_ord = db.query(func.count(Order.id)).scalar() or 0
    total_prods = db.query(func.count(Product.id)).scalar() or 0
    total_custs = db.query(func.count(Customer.id)).scalar() or 0

    kpi_data = [
        ["Total Revenue", "Total Orders", "Total Products", "Total Customers"],
        [f"INR {float(total_rev):,.2f}", str(total_ord), str(total_prods), str(total_custs)]
    ]
    kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4E3629')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F7F7F5')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 20))

    # Top selling furniture products table
    elements.append(Paragraph("Top Performing Furniture Items", section_style))
    elements.append(Spacer(1, 8))

    top_prods = (
        db.query(Product.name, Category.name, func.sum(Sale.quantity), func.sum(Sale.amount))
        .outerjoin(Category, Product.category_id == Category.id)
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.id, Product.name, Category.name)
        .order_by(func.sum(Sale.amount).desc())
        .limit(10)
        .all()
    )

    prod_table_data = [["Product Name", "Category", "Units Sold", "Total Revenue (INR)"]]
    for tp in top_prods:
        prod_table_data.append([
            tp[0],
            tp[1] or "General",
            str(tp[2]),
            f"INR {float(tp[3]):,.2f}"
        ])

    prod_table = Table(prod_table_data, colWidths=[200, 110, 80, 130])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8D6E63')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDBDBD')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
    ]))
    elements.append(prod_table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"furniture_shop_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/excel")
def export_excel_report(db: Session = Depends(get_db)):
    """Generates an Excel (.xlsx) workbook with Sales, Products, and Orders sheets."""
    wb = openpyxl.Workbook()
    # Sheet 1: Sales Summary
    ws_sales = wb.active
    ws_sales.title = "Sales Transactions"

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4E3629", end_color="4E3629", fill_type="solid")

    headers = ["Sale ID", "Order ID", "Product Name", "Quantity", "Amount (INR)", "Sale Date"]
    ws_sales.append(headers)
    for col_num in range(1, len(headers) + 1):
        cell = ws_sales.cell(row=1, column=col_num)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    sales = (
        db.query(Sale)
        .join(Sale.product)
        .options(joinedload(Sale.product))
        .order_by(Sale.sale_date.desc())
        .all()
    )
    for s in sales:
        ws_sales.append([
            s.id,
            s.order_id,
            s.product.name if s.product else "N/A",
            s.quantity,
            float(s.amount),
            s.sale_date.strftime("%Y-%m-%d %H:%M:%S")
        ])

    # Sheet 2: Inventory Status
    ws_inv = wb.create_sheet(title="Product Inventory")
    inv_headers = ["Product ID", "SKU", "Name", "Category", "Price (INR)", "Stock Qty", "Min Stock", "Status"]
    ws_inv.append(inv_headers)
    for col_num in range(1, len(inv_headers) + 1):
        cell = ws_inv.cell(row=1, column=col_num)
        cell.font = header_font
        cell.fill = PatternFill(start_color="8D6E63", end_color="8D6E63", fill_type="solid")
        cell.alignment = Alignment(horizontal="center")

    products = db.query(Product).options(joinedload(Product.category)).order_by(Product.name.asc()).all()
    for p in products:
        ws_inv.append([
            p.id,
            p.sku,
            p.name,
            p.category.name if p.category else "Uncategorized",
            float(p.price),
            p.stock_quantity,
            p.minimum_stock_level,
            p.status
        ])

    # Adjust column widths
    for sheet in [ws_sales, ws_inv]:
        for col in sheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            sheet.column_dimensions[col_letter].width = max(max_len + 3, 12)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"furniture_shop_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
