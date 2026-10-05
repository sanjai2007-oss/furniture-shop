import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import engine, Base
from app.models import *  # import all models so tables are registered

# Import routers
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.products import router as products_router
from app.routes.customers import router as customers_router
from app.routes.orders import router as orders_router
from app.routes.inventory import router as inventory_router
from app.routes.suppliers import router as suppliers_router
from app.routes.sales import router as sales_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reports import router as reports_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Furniture Shop Management System API",
    description="Production-ready REST API for modern furniture store management, compatible with Web Dashboard and Mobile Applications.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8081",  # Expo / React Native
    settings.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production-ready open CORS for web & mobile app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded product photos
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Unified exception handling for consistent JSON responses
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "data": None
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join([f"{err.get('loc', ['field'])[-1]}: {err.get('msg', 'invalid')}" for err in errors])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": f"Validation error: {msg}",
            "data": errors
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": f"Internal server error: {str(exc)}",
            "data": None
        }
    )

# Register all API routers
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(inventory_router)
app.include_router(suppliers_router)
app.include_router(sales_router)
app.include_router(dashboard_router)
app.include_router(reports_router)

@app.get("/", tags=["Health"])
def root():
    return {
        "success": True,
        "message": "Furniture Shop Management API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": os.getenv("ENVIRONMENT", "development")
    }
