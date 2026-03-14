import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status

from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.repositories.user_repo import user_repo

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = user_repo.get_by_email(body.email)
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "tenant_id": user["tenant_id"],
    }

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            display_name=user["display_name"],
            role=user["role"],
            tenant_id=user["tenant_id"],
        ),
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    existing = user_repo.get_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    now = datetime.now(timezone.utc).isoformat()
    tenant_id = str(uuid.uuid4())

    # Create tenant first (FK constraint)
    from app.integrations.supabase_client import get_supabase
    get_supabase().table("tenants").insert({
        "id": tenant_id,
        "name": body.display_name + "'s Organization",
        "slug": body.email.split("@")[0],
        "created_at": now,
        "updated_at": now,
    }).execute()

    user_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "display_name": body.display_name,
        "role": "admin",  # First user is admin
        "created_at": now,
        "updated_at": now,
    })

    return {"message": "Account created successfully"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = user_repo.get_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "tenant_id": user["tenant_id"],
    }

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            display_name=user["display_name"],
            role=user["role"],
            tenant_id=user["tenant_id"],
        ),
    )


@router.get("/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = user_repo.get_by_id(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "data": UserResponse(
            id=user["id"],
            email=user["email"],
            display_name=user["display_name"],
            role=user["role"],
            tenant_id=user["tenant_id"],
        )
    }
