from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(5, 2), default=0.00, nullable=False)  # Percentage discount (e.g. 10.0 for 10%)
    stock_quantity = Column(Integer, default=0, nullable=False)
    minimum_stock_level = Column(Integer, default=5, nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    inventory_transactions = relationship("InventoryTransaction", back_populates="product", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="product")

    @property
    def status(self) -> str:
        if self.stock_quantity <= 0:
            return "Out of Stock"
        elif self.stock_quantity <= self.minimum_stock_level:
            return "Low Stock"
        return "Available"
