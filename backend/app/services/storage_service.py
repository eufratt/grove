import httpx
import uuid
from fastapi import UploadFile
from app.config import settings

async def upload_product_photo(file: UploadFile) -> str:
    """
    Uploads a photo to Supabase Storage and returns the public URL.
    """
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_name = f"{uuid.uuid4()}.{file_extension}"
    
    storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{file_name}"
    
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": file.content_type,
    }
    
    file_content = await file.read()
    
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
