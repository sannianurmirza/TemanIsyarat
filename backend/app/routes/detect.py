from fastapi import APIRouter, File, UploadFile, Form
from app.utils.predict_utils import load_models, predict_from_image

router = APIRouter()

models, pipeline, labels = load_models()

@router.post("/detect")
async def detect(file: UploadFile = File(...), model_type: str = Form("full")):
    """
    model_type = 'full' untuk huruf, 'words' untuk kata
    """
    image_bytes = await file.read()
    result = predict_from_image(image_bytes, models, pipeline, labels, model_name=model_type)
    return result
