import os
import uuid
import logging
from typing import Optional
from fastapi import UploadFile
import cloudinary
import cloudinary.uploader
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary if credentials are provided
cloudinary_configured = False
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
    cloudinary_configured = True
    logger.info("Cloudinary configured successfully.")

async def upload_image(file: UploadFile, base_url: str = "") -> str:
    """
    Uploads an image file to Cloudinary if configured;
    otherwise saves to local uploads directory and returns the accessible URL.
    """
    if cloudinary_configured:
        try:
            content = await file.read()
            upload_result = cloudinary.uploader.upload(
                content,
                folder="furniture_shop/products"
            )
            return upload_result.get("secure_url")
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}. Falling back to local storage.")
            await file.seek(0)

    # Local fallback
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    clean_base_url = base_url.rstrip("/") if base_url else ""
    return f"{clean_base_url}/uploads/{unique_filename}"
