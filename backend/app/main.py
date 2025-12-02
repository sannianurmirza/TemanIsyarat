"""
TemanIsyarat Backend - FastAPI with Proper CORS
File: backend/app/main.py

IMPORTANT: Replace your existing main.py with this file
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Import detection logic dari predict_utils.py
from app.utils.predict_utils import load_models, predict_from_image

# =====================================================================
#   FASTAPI APP INITIALIZATION
# =====================================================================

app = FastAPI(
    title="TemanIsyarat API",
    description="API untuk deteksi bahasa isyarat SIBI (huruf dan kata)",
    version="1.0.0"
)

# =====================================================================
#   CORS CONFIGURATION - CRITICAL FOR FRONTEND CONNECTION
# =====================================================================

# IMPORTANT: Allow frontend origins untuk development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js default port
        "http://localhost:3001",      # Alternative Next.js port
        "http://127.0.0.1:3000",      # IP version
        "http://127.0.0.1:3001",      # IP alternative port
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

print("✅ CORS middleware configured for frontend origins")

# =====================================================================
#   LOAD MODELS ON STARTUP
# =====================================================================

models = None
pipeline = None
labels_map = None

@app.on_event("startup")
async def startup_event():
    """Load models when server starts"""
    global models, pipeline, labels_map
    
    print("\n" + "="*60)
    print("🚀 Starting TemanIsyarat Backend...")
    print("="*60)
    
    try:
        models, pipeline, labels_map = load_models()
        print("\n✅ All models loaded successfully!")
        print("📦 Available models:", list(models.keys()) if models else "None")
        print("🌐 CORS enabled for frontend connection")
        print("="*60 + "\n")
    except Exception as e:
        print(f"\n❌ ERROR loading models: {e}")
        print("="*60 + "\n")
        raise


# =====================================================================
#   HEALTH CHECK ENDPOINT - REQUIRED BY FRONTEND
# =====================================================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint - Frontend akan call ini untuk verifikasi koneksi
    
    Returns:
        JSON dengan status backend dan info models
    """
    return {
        "status": "healthy",
        "message": "TemanIsyarat Backend is running",
        "models_loaded": models is not None,
        "available_models": list(models.keys()) if models else [],
        "total_models": len(models) if models else 0,
        "labels": {
            "letters": len(labels_map.get("full", [])) if labels_map else 0,
            "words": len(labels_map.get("words", [])) if labels_map else 0,
        }
    }


# =====================================================================
#   DETECTION ENDPOINTS
# =====================================================================

@app.post("/api/detect/letters")
async def detect_letters(file: UploadFile = File(...)):
    """
    Deteksi huruf SIBI (A-Z)
    
    Args:
        file: Image file (JPG, PNG, WebP)
    
    Returns:
        JSON: {
            "prediction": "A",
            "confidence": 95.5,
            "all_predictions": [...],
            "model_used": "full",
            "total_classes": 26
        }
    """
    # Validasi models loaded
    if not models:
        print("❌ Models not loaded!")
        raise HTTPException(
            status_code=500, 
            detail="Models not loaded. Please restart the server."
        )
    
    # Validasi model huruf tersedia
    if "full" not in models:
        print("❌ Letter model ('full') not found!")
        raise HTTPException(
            status_code=500,
            detail="Letter detection model not available"
        )
    
    try:
        print(f"\n{'='*60}")
        print(f"📥 Received request: /api/detect/letters")
        print(f"📁 File: {file.filename}")
        print(f"📊 Content-Type: {file.content_type}")
        
        # Read image bytes
        image_bytes = await file.read()
        print(f"📦 Image size: {len(image_bytes)} bytes")
        
        # Predict using 'full' model (26 letters A-Z)
        result = predict_from_image(
            image_bytes=image_bytes,
            models=models,
            pipeline=pipeline,
            labels_map=labels_map,
            model_name="full",  # Model huruf (A-Z)
            top_k=3
        )
        
        print(f"✅ Prediction successful: {result['prediction']} ({result['confidence']:.2f}%)")
        print(f"{'='*60}\n")
        
        return JSONResponse(content=result)
    
    except Exception as e:
        print(f"❌ Error in detect_letters: {e}")
        print(f"{'='*60}\n")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/detect/words")
async def detect_words(file: UploadFile = File(...)):
    """
    Deteksi kata SIBI (102 kata)
    
    Args:
        file: Image file (JPG, PNG, WebP)
    
    Returns:
        JSON: {
            "prediction": "Rumah",
            "confidence": 92.3,
            "all_predictions": [...],
            "model_used": "words",
            "total_classes": 102
        }
    """
    # Validasi models loaded
    if not models:
        print("❌ Models not loaded!")
        raise HTTPException(
            status_code=500,
            detail="Models not loaded. Please restart the server."
        )
    
    # Validasi model kata tersedia
    if "words" not in models:
        print("❌ Words model not found!")
        raise HTTPException(
            status_code=500,
            detail="Word detection model not available"
        )
    
    try:
        print(f"\n{'='*60}")
        print(f"📥 Received request: /api/detect/words")
        print(f"📁 File: {file.filename}")
        print(f"📊 Content-Type: {file.content_type}")
        
        # Read image bytes
        image_bytes = await file.read()
        print(f"📦 Image size: {len(image_bytes)} bytes")
        
        # Predict using 'words' model (102 kata SIBI)
        result = predict_from_image(
            image_bytes=image_bytes,
            models=models,
            pipeline=pipeline,
            labels_map=labels_map,
            model_name="words",  # Model kata (102 kata)
            top_k=3
        )
        
        print(f"✅ Prediction successful: {result['prediction']} ({result['confidence']:.2f}%)")
        print(f"{'='*60}\n")
        
        return JSONResponse(content=result)
    
    except Exception as e:
        print(f"❌ Error in detect_words: {e}")
        print(f"{'='*60}\n")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
#   ROOT ENDPOINT
# =====================================================================

@app.get("/")
async def root():
    """Root endpoint with API info and documentation links"""
    return {
        "message": "🤟 TemanIsyarat API - Deteksi Bahasa Isyarat SIBI",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc",
            "detect_letters": "/api/detect/letters (POST)",
            "detect_words": "/api/detect/words (POST)",
        },
        "models": {
            "loaded": models is not None,
            "available": list(models.keys()) if models else [],
        },
        "instructions": {
            "test_api": "Visit /docs for interactive API documentation",
            "check_health": "Visit /health to check backend status",
        }
    }


# =====================================================================
#   RUN SERVER (for development)
# =====================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting TemanIsyarat Backend Server...")
    print("="*60)
    print("📍 Host: 0.0.0.0 (accessible from all interfaces)")
    print("📍 Port: 8000")
    print("📖 API Docs: http://localhost:8000/docs")
    print("💚 Health Check: http://localhost:8000/health")
    print("="*60 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,
        reload=True,     # Auto-reload on code changes (development only)
        log_level="info"
    )