from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=ApiResponse[List[CategoryResponse]])
def get_categories(db: Session = Depends(get_db)):
    """Retrieves all categories with product counts."""

    categories = db.query(Category).order_by(Category.name.asc()).all()

    results = []

    for cat in categories:
        count = (
            db.query(func.count(Product.id))
            .filter(Product.category_id == cat.id)
            .scalar()
            or 0
        )

        cat_resp = CategoryResponse(
            id=cat.id,
            name=cat.name,
            description=cat.description,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
            product_count=count
        )

        results.append(cat_resp)

    return ApiResponse(
        success=True,
        message="Categories retrieved successfully",
        data=results
    )


@router.post("", response_model=ApiResponse[CategoryResponse])
def create_category(
    category_in: CategoryCreate,
    db: Session = get_db()
):
    """Creates a new category."""

    existing = (
        db.query(Category)
        .filter(Category.name.ilike(category_in.name))
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category with this name already exists"
        )

    category = Category(
        name=category_in.name,
        description=category_in.description
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return ApiResponse(
        success=True,
        message="Category created successfully",
        data=CategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            created_at=category.created_at,
            updated_at=category.updated_at,
            product_count=0
        )
    )


@router.put("/{category_id}", response_model=ApiResponse[CategoryResponse])
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = get_db()
):
    """Updates an existing category."""

    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    if category_in.name is not None:
        duplicate = (
            db.query(Category)
            .filter(
                Category.name.ilike(category_in.name),
                Category.id != category_id
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Category with this name already exists"
            )

        category.name = category_in.name

    if category_in.description is not None:
        category.description = category_in.description

    db.commit()
    db.refresh(category)

    count = (
        db.query(func.count(Product.id))
        .filter(Product.category_id == category.id)
        .scalar()
        or 0
    )

    return ApiResponse(
        success=True,
        message="Category updated successfully",
        data=CategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            created_at=category.created_at,
            updated_at=category.updated_at,
            product_count=count
        )
    )


@router.delete("/{category_id}", response_model=ApiResponse[dict])
def delete_category(
    category_id: int,
    db: Session = get_db()
):
    """Deletes a category."""

    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()

    return ApiResponse(
        success=True,
        message="Category deleted successfully",
        data={"id": category_id}
    )