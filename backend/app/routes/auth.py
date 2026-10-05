from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenResponse
from app.schemas.common import ApiResponse
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=ApiResponse[UserResponse])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user (admin or self-service if no users exist)."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=hashed_pwd,
        role=user_in.role.upper(),
        phone=user_in.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return ApiResponse(
        success=True,
        message="User registered successfully",
        data=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates user with email and password and returns a JWT Bearer token."""
    user = db.query(User).filter(User.email == login_req.email.lower()).first()
    if not user or not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return ApiResponse(
        success=True,
        message="Login successful",
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
    )

@router.get("/me", response_model=ApiResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return ApiResponse(
        success=True,
        message="Profile retrieved successfully",
        data=UserResponse.model_validate(current_user)
    )
