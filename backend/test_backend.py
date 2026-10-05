import sys
import os

# Set working directory to backend
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("Testing /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("Health check OK:", res.json())

    print("\nTesting /api/auth/login for Admin...")
    res = client.post("/api/auth/login", json={"email": "admin@furniture.com", "password": "Admin@123"})
    assert res.status_code == 200, res.text
    login_data = res.json()["data"]
    token = login_data["access_token"]
    print(f"Login OK: Welcome {login_data['user']['name']} (Role: {login_data['user']['role']})")
    headers = {"Authorization": f"Bearer {token}"}

    print("\nTesting /api/auth/me...")
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200, res.text
    print("Auth Me OK:", res.json()["data"]["email"])

    print("\nTesting /api/categories...")
    res = client.get("/api/categories")
    assert res.status_code == 200, res.text
    categories = res.json()["data"]
    print(f"Categories count: {len(categories)} (e.g. {categories[0]['name']} has {categories[0]['product_count']} products)")

    print("\nTesting /api/products...")
    res = client.get("/api/products?page=1&limit=5")
    assert res.status_code == 200, res.text
    products_page = res.json()
    print(f"Products total: {products_page['pagination']['total']}, returned {len(products_page['data'])}")

    print("\nTesting /api/inventory/summary...")
    res = client.get("/api/inventory/summary")
    assert res.status_code == 200, res.text
    print("Inventory summary:", res.json()["data"])

    print("\nTesting /api/dashboard/summary...")
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200, res.text
    dash = res.json()["data"]
    print("Dashboard KPI Total Sales:", dash["kpi"]["total_sales"])
    print(f"Dashboard Recent Orders: {len(dash['recent_orders'])}")
    print(f"Dashboard Top Products: {len(dash['top_products'])}")
    print(f"Dashboard Low Stock Alerts: {len(dash['low_stock_alerts'])}")

    print("\nTesting /api/reports/summary...")
    res = client.get("/api/reports/summary")
    assert res.status_code == 200, res.text
    rep = res.json()["data"]
    print("Reports Overview Revenue:", rep["overview"]["total_revenue"])

    print("\nTesting /api/reports/export/pdf...")
    res = client.get("/api/reports/export/pdf")
    assert res.status_code == 200, res.text
    assert len(res.content) > 1000
    print(f"PDF Generated successfully ({len(res.content)} bytes)")

    print("\nTesting /api/reports/export/excel...")
    res = client.get("/api/reports/export/excel")
    assert res.status_code == 200, res.text
    assert len(res.content) > 1000
    print(f"Excel file generated successfully ({len(res.content)} bytes)")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! Ready for Frontend & Mobile Clients.")

if __name__ == "__main__":
    test_api()
