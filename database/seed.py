import sys
import os
from decimal import Decimal
from datetime import datetime, timedelta
import random

# Add backend directory to sys.path so we can import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(parent_dir, "backend")
sys.path.insert(0, backend_dir)

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.supplier import Supplier
from app.models.inventory import InventoryTransaction
from app.models.sale import Sale
from app.auth import get_password_hash

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@furniture.com").first():
            print("Database already contains seed data. Skipping seed script.")
            return

        print("Seeding Users (Admin, Manager, Staff)...")
        users = [
            User(
                name="Anand Sharma (Admin)",
                email="admin@furniture.com",
                password_hash=get_password_hash("Admin@123"),
                role="ADMIN",
                phone="+91 98765 43210"
            ),
            User(
                name="Priya Patel (Manager)",
                email="manager@furniture.com",
                password_hash=get_password_hash("Manager@123"),
                role="MANAGER",
                phone="+91 98765 43211"
            ),
            User(
                name="Rahul Verma (Staff)",
                email="staff@furniture.com",
                password_hash=get_password_hash("Staff@123"),
                role="STAFF",
                phone="+91 98765 43212"
            )
        ]
        db.add_all(users)
        db.commit()

        print("Seeding Furniture Categories...")
        categories_data = [
            {"name": "Living Room", "description": "Premium sofas, recliners, coffee tables, and contemporary TV entertainment consoles."},
            {"name": "Bedroom", "description": "Luxury wooden beds, spacious wardrobes, dressers, and bedside nightstands."},
            {"name": "Dining", "description": "Solid wood dining tables, ergonomic chairs, bar units, and sideboards."},
            {"name": "Office", "description": "Ergonomic work chairs, executive study desks, and modern bookshelf storage."},
            {"name": "Outdoor Furniture", "description": "Weatherproof patio sets, rattan loungers, garden coffee tables, and balcony seating."},
            {"name": "Accent & Storage", "description": "Entryway shoe racks, accent cabinets, wall shelves, and multifunctional storage stools."}
        ]
        category_objects = {}
        for c_data in categories_data:
            cat = Category(name=c_data["name"], description=c_data["description"])
            db.add(cat)
            db.flush()
            category_objects[c_data["name"]] = cat

        print("Seeding Verified Suppliers...")
        suppliers_data = [
            Supplier(name="Apex Teak & Timber Ltd", contact_person="Rajesh Kumar", phone="+91 98112 34567", email="sales@apexteak.com", address="Plot 45, Timber Market, Kirti Nagar", city="New Delhi"),
            Supplier(name="Royal Comfort Foam & Fabrics", contact_person="Sunita Rao", phone="+91 97234 56789", email="contact@royalcomfort.in", address="88 Industrial Layout, Peenya", city="Bengaluru"),
            Supplier(name="Heritage Woodcrafts Co.", contact_person="Vikram Singh", phone="+91 99345 67890", email="orders@heritagewood.com", address="12 Craftsman Lane, GIDC", city="Ahmedabad"),
            Supplier(name="SteelForm Office Ergonomics", contact_person="Amit Deshmukh", phone="+91 98456 78901", email="supplies@steelform.co.in", address="5B MIDC Industrial Area", city="Pune"),
            Supplier(name="Artisan Rattan & Cane Works", contact_person="Kavita Menon", phone="+91 97567 89012", email="artisan@rattancrafts.com", address="74 Marine View Estate", city="Kochi")
        ]
        db.add_all(suppliers_data)
        db.commit()

        print("Seeding Furniture Products with Photography...")
        products_data = [
            {
                "name": "Modern 3-Seater Velvet Sofa",
                "category": "Living Room",
                "description": "Luxurious high-density foam cushioning with soft stain-resistant velvet fabric and solid oak tapered legs.",
                "price": Decimal("46999.00"),
                "discount": Decimal("10.00"),
                "stock_quantity": 14,
                "minimum_stock_level": 4,
                "sku": "LIV-SOF-001",
                "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Premium Top-Grain Leather Recliner",
                "category": "Living Room",
                "description": "Ergonomic multi-angle reclining mechanism with breathable genuine leather and plush armrests.",
                "price": Decimal("32500.00"),
                "discount": Decimal("5.00"),
                "stock_quantity": 8,
                "minimum_stock_level": 3,
                "sku": "LIV-REC-002",
                "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Solid Teak Wood Round Coffee Table",
                "category": "Living Room",
                "description": "Handcrafted round coffee table made from seasoned sustainable teak wood with water-resistant walnut finish.",
                "price": Decimal("14499.00"),
                "discount": Decimal("0.00"),
                "stock_quantity": 3,  # Low Stock!
                "minimum_stock_level": 4,
                "sku": "LIV-CFT-003",
                "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Minimalist Oak Floating TV Unit",
                "category": "Living Room",
                "description": "Sleek wall-mounted media console with hidden cable pass-throughs and dual soft-close drawers.",
                "price": Decimal("18999.00"),
                "discount": Decimal("8.00"),
                "stock_quantity": 11,
                "minimum_stock_level": 3,
                "sku": "LIV-TVU-004",
                "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "King Size Upholstered Platform Bed",
                "category": "Bedroom",
                "description": "Modern king bed frame featuring a tufted fabric headboard, reinforced wooden slats, and zero squeak acoustic design.",
                "price": Decimal("54999.00"),
                "discount": Decimal("12.00"),
                "stock_quantity": 6,
                "minimum_stock_level": 2,
                "sku": "BED-PLB-001",
                "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "3-Door Teak Wardrobe with Mirror",
                "category": "Bedroom",
                "description": "Spacious wardrobe with integrated hanging rods, internal safety locker, and premium silent-glide hinges.",
                "price": Decimal("38500.00"),
                "discount": Decimal("0.00"),
                "stock_quantity": 5,
                "minimum_stock_level": 3,
                "sku": "BED-WAR-002",
                "image_url": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Scandinavian 2-Drawer Bedside Table",
                "category": "Bedroom",
                "description": "Compact bedside nightstand with fluted drawer fronts and solid brass knob handles.",
                "price": Decimal("6499.00"),
                "discount": Decimal("0.00"),
                "stock_quantity": 0,  # Out of Stock!
                "minimum_stock_level": 4,
                "sku": "BED-NST-003",
                "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "6-Seater Sheesham Dining Table Set",
                "category": "Dining",
                "description": "Complete dining ensemble crafted from solid Indian Rosewood (Sheesham) with 6 cushioned ergonomic chairs.",
                "price": Decimal("52000.00"),
                "discount": Decimal("15.00"),
                "stock_quantity": 7,
                "minimum_stock_level": 2,
                "sku": "DIN-SET-001",
                "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Upholstered Dining Accent Chair",
                "category": "Dining",
                "description": "Contemporary curved bucket dining chair with premium textured bouclé fabric and matte black metal legs.",
                "price": Decimal("5499.00"),
                "discount": Decimal("0.00"),
                "stock_quantity": 22,
                "minimum_stock_level": 6,
                "sku": "DIN-CHR-002",
                "image_url": "https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Ergonomic High-Back Executive Chair",
                "category": "Office",
                "description": "Breathable mesh back with adjustable lumbar support, 3D armrests, synchronized tilt, and smooth PU castor wheels.",
                "price": Decimal("16499.00"),
                "discount": Decimal("5.00"),
                "stock_quantity": 18,
                "minimum_stock_level": 5,
                "sku": "OFF-CHR-001",
                "image_url": "https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Solid Wood Executive Study Desk",
                "category": "Office",
                "description": "Spacious 60-inch desktop with cable grommet, lockable drawer unit, and headphone dock.",
                "price": Decimal("24999.00"),
                "discount": Decimal("0.00"),
                "stock_quantity": 9,
                "minimum_stock_level": 3,
                "sku": "OFF-DSK-002",
                "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Industrial 5-Tier Bookshelf & Display",
                "category": "Accent & Storage",
                "description": "Open architectural shelving made with rustic pine shelves supported by heavy-duty black powder-coated steel frame.",
                "price": Decimal("12999.00"),
                "discount": Decimal("0.00"),
                "stock_quantity": 3,  # Low stock
                "minimum_stock_level": 4,
                "sku": "ACC-BKS-001",
                "image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Entryway Wooden Shoe Bench with Cushion",
                "category": "Accent & Storage",
                "description": "Dual-level shoe rack accommodating 8 pairs with padded top seat for comfortable sitting while wearing shoes.",
                "price": Decimal("8499.00"),
                "discount": Decimal("0.00"),
                "stock_quantity": 15,
                "minimum_stock_level": 4,
                "sku": "ACC-SHR-002",
                "image_url": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Weatherproof Rattan Patio Lounge Set",
                "category": "Outdoor Furniture",
                "description": "UV-resistant PE wicker outdoor sofa pair with tempered glass coffee table and water-repellent cushions.",
                "price": Decimal("42000.00"),
                "discount": Decimal("10.00"),
                "stock_quantity": 2,  # Low Stock!
                "minimum_stock_level": 3,
                "sku": "OUT-PAT-001",
                "image_url": "https://images.unsplash.com/photo-1519947486513-ce62b9a0b15a?auto=format&fit=crop&w=800&q=80"
            }
        ]

        created_products = []
        for p_data in products_data:
            cat = category_objects.get(p_data["category"])
            prod = Product(
                category_id=cat.id if cat else None,
                name=p_data["name"],
                description=p_data["description"],
                price=p_data["price"],
                discount=p_data["discount"],
                stock_quantity=p_data["stock_quantity"],
                minimum_stock_level=p_data["minimum_stock_level"],
                sku=p_data["sku"],
                image_url=p_data["image_url"]
            )
            db.add(prod)
            db.flush()
            created_products.append(prod)

            # Record initial inventory stock log
            if prod.stock_quantity > 0:
                tx = InventoryTransaction(
                    product_id=prod.id,
                    transaction_type="Purchase",
                    quantity=prod.stock_quantity,
                    previous_quantity=0,
                    new_quantity=prod.stock_quantity,
                    reason="Initial warehouse stock"
                )
                db.add(tx)

        db.commit()

        print("Seeding Realistic Customers...")
        customers_data = [
            Customer(name="Vikram Malhotra", phone="+91 98201 12345", email="vikram.malhotra@gmail.com", address="B-402, Sea Green Apts, Worli", city="Mumbai", state="Maharashtra", pincode="400018"),
            Customer(name="Aishwarya Iyer", phone="+91 98450 67890", email="aishwarya.iyer@techcorp.in", address="Flat 12A, Brigade Gateway, Malleshwaram", city="Bengaluru", state="Karnataka", pincode="560055"),
            Customer(name="Rohan Singhania", phone="+91 99100 23456", email="rohan.singh@outlook.com", address="45 Golf Links, Near Khan Market", city="New Delhi", state="Delhi", pincode="110003"),
            Customer(name="Deepika Sundaram", phone="+91 98401 34567", email="deepika.s@chennaiclinic.org", address="7/2 Harrington Road, Chetpet", city="Chennai", state="Tamil Nadu", pincode="600031"),
            Customer(name="Karthik Reddy", phone="+91 98490 45678", email="karthik.reddy@hyderabadvillas.com", address="Villa 18, Palm Meadows, Jubilee Hills", city="Hyderabad", state="Telangana", pincode="500033"),
            Customer(name="Neha Joshi", phone="+91 98220 56789", email="neha.joshi@puneconsulting.com", address="903 Sky High Heights, Baner Road", city="Pune", state="Maharashtra", pincode="411045"),
            Customer(name="Arjun Roy", phone="+91 98300 67890", email="arjun.roy@kolkatamedia.in", address="22 Park Street, 3rd Floor", city="Kolkata", state="West Bengal", pincode="700016"),
            Customer(name="Meera Kapoor", phone="+91 98140 78901", email="meera.kapoor@lifestyle.com", address="14 Sector 9, Giani Zail Singh Marg", city="Chandigarh", state="Punjab", pincode="160009")
        ]
        db.add_all(customers_data)
        db.commit()

        print("Seeding Historical Orders & Sales Records...")
        now = datetime.now()
        order_statuses = ["Delivered", "Delivered", "Delivered", "Processing", "Shipped", "Confirmed", "Pending"]
        payment_statuses = ["Paid", "Paid", "Paid", "Paid", "Pending"]

        # Generate realistic orders over the last 45 days
        for i in range(16):
            days_ago = random.randint(1, 40)
            order_date = now - timedelta(days=days_ago, hours=random.randint(1, 10))
            cust = random.choice(customers_data)
            status_order = random.choice(order_statuses)
            status_pay = "Paid" if status_order in ["Delivered", "Shipped"] else random.choice(payment_statuses)

            # Pick 1 to 3 items
            selected_prods = random.sample(created_products, k=random.randint(1, 3))
            order_subtotal = Decimal("0.00")
            line_items = []

            for sp in selected_prods:
                qty = random.randint(1, 2)
                unit_price = sp.price
                if sp.discount > 0:
                    unit_price = unit_price - (unit_price * (sp.discount / Decimal("100")))
                line_total = unit_price * qty
                order_subtotal += line_total
                line_items.append((sp, qty, unit_price, line_total))

            order_discount = Decimal("500.00") if order_subtotal > Decimal("30000.00") else Decimal("0.00")
            final_order_total = max(Decimal("0.00"), order_subtotal - order_discount)

            order = Order(
                customer_id=cust.id,
                total_amount=final_order_total,
                discount=order_discount,
                payment_status=status_pay,
                order_status=status_order,
                shipping_address=cust.address,
                created_at=order_date,
                updated_at=order_date
            )
            db.add(order)
            db.flush()

            for sp, qty, price, line_total in line_items:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=sp.id,
                    quantity=qty,
                    price=price,
                    created_at=order_date
                )
                db.add(order_item)

                sale = Sale(
                    order_id=order.id,
                    product_id=sp.id,
                    quantity=qty,
                    amount=line_total,
                    sale_date=order_date,
                    created_at=order_date
                )
                db.add(sale)

                # Inventory transaction for sale
                inv_log = InventoryTransaction(
                    product_id=sp.id,
                    transaction_type="Sale",
                    quantity=-qty,
                    previous_quantity=sp.stock_quantity + qty,
                    new_quantity=sp.stock_quantity,
                    reason=f"Sale order #{order.id}",
                    created_at=order_date
                )
                db.add(inv_log)

        db.commit()
        print("Database seeded successfully with realistic furniture business data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
