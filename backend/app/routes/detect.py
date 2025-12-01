from fastapi import APIRouter, File, UploadFile, Form
from app.utils.predict_utils import load_models, predict_from_image

router = APIRouter()

# Load models saat startup
print("\n🚀 Loading models...")
models, pipeline, labels_map = load_models()
print("✅ All models ready!\n")


@router.get("/models/info")
async def get_models_info():
    return {
        "available_models": list(models.keys()),
        "labels": {
            name: {
                "count": len(labels),
                "labels": labels
            }
            for name, labels in labels_map.items()
        }
    }


# ====================================================
# ENDPOINT DEFAULT (BACKWARD COMPATIBILITY)
# ====================================================
@router.post("/detect")
async def detect(file: UploadFile = File(...), model_type: str = Form("full")):
    if model_type not in models:
        return {
            "error": f"Model '{model_type}' tidak tersedia",
            "available_models": list(models.keys())
        }
    
    image_bytes = await file.read()
    
    return predict_from_image(
        image_bytes,
        models,
        pipeline,
        labels_map,
        model_name=model_type
    )


# ====================================================
# ENDPOINT BARU — DETEKSI HURUF (A-Z)
# ====================================================
@router.post("/detect/letters")
async def detect_letters(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    return predict_from_image(
        image_bytes,
        models,
        pipeline,
        labels_map,
        model_name="full"
    )


# ====================================================
# ENDPOINT BARU — DETEKSI KATA (104 SIBI)
# ====================================================
@router.post("/detect/words")
async def detect_words(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    return predict_from_image(
        image_bytes,
        models,
        pipeline,
        labels_map,
        model_name="words"
    )
