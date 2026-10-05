# Furniture Shop Management System - FastAPI Backend

A high-performance, asynchronous REST API built with FastAPI, SQLAlchemy ORM, and PostgreSQL. Designed for both desktop web administration and mobile application consumption (React Native / Expo).

## Features
- **Stateless RESTful Architecture**: JSON API with Bearer JWT authentication and RBAC (`ADMIN`, `MANAGER`, `STAFF`).
- **PostgreSQL Database Support**: Full relational modeling with automatic fallback for local zero-config testing.
- **Automatic Audit Trail**: All inventory changes (purchases, damages, adjustments, returns, sales) are tracked in `inventory_transactions`.
- **Integrated Image Service**: Direct Cloudinary integration with automatic local fallback storage for development.
- **Reporting Engine**: Dynamic PDF and Excel (.xlsx) export of sales and inventory data.
- **Interactive Documentation**: Swagger UI at `/docs` and ReDoc at `/redoc`.

## Setup & Running Locally

### 1. Requirements
- Python 3.10+
- PostgreSQL (or local SQLite fallback)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your PostgreSQL URL:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/furniture_shop
SECRET_KEY=your_secure_secret_key_here
```

### 4. Seed Realistic Furniture Data
```bash
python ../database/seed.py
```

### 5. Run the Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

## Docker Deployment
```bash
docker build -t furniture-shop-backend .
docker run -p 8000:8000 --env-file .env furniture-shop-backend
```
