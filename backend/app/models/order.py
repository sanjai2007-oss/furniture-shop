from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    discount = Column(Numeric(10, 2), nullable=False, default=0.00)
    payment_status = Column(String(50), nullable=False, default="Pending")  # Pending, Paid, Partially Paid, Refunded
    order_status = Column(String(50), nullable=False, default="Pending")  # Pending, Confirmed, Processing, Shipped, Delivered, Cancelled
    shipping_address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="order", cascade="all, delete-orphan")
