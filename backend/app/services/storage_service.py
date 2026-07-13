import io
import httpx
import uuid
from fastapi import UploadFile
from PIL import Image, ImageOps
from app.config import settings

async def upload_product_photo(file: UploadFile) -> str:
    """
    Uploads a photo to Supabase Storage and returns the public URL.
    Resizes the image to a max of 1600px on the longest side and compresses to JPEG quality 80.
    """
    raw_content = await file.read()
    
    try:
        # Load image into Pillow
        img = Image.open(io.BytesIO(raw_content))
        
        # Auto-rotate image based on EXIF tags if present
        img = ImageOps.exif_transpose(img)
        
        # Convert RGBA/P to RGB if saving to JPEG
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        # Resize preserving aspect ratio
        max_size = 1600
        w, h = img.size
        if w > max_size or h > max_size:
            if w > h:
                new_w = max_size
                new_h = int(h * (max_size / w))
            else:
                new_h = max_size
                new_w = int(w * (max_size / h))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        # Compress and save as JPEG quality 80 to memory
        output_buffer = io.BytesIO()
        img.save(output_buffer, format="JPEG", quality=80, optimize=True)
        file_content = output_buffer.getvalue()
        content_type = "image/jpeg"
        file_extension = "jpg"
    except Exception as e:
        # Fallback to uploading original content if Pillow fails
        print(f"Failed to compress image, uploading original: {e}")
        file_content = raw_content
        content_type = file.content_type
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"

    file_name = f"{uuid.uuid4()}.{file_extension}"
    storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{file_name}"
    
    headers = {
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            storage_url,
            content=file_content,
            headers=headers
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to upload to Supabase: {response.text}")
            
    # Return the public URL
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{file_name}"
