from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.detect import router as detect_router

app = FastAPI(title="TemanIsyarat Backend")

# 🟢 Daftar domain frontend yang diizinkan
allowed_origins = [
    "http://localhost:3000",      # Next.js dev default
    "http://127.0.0.1:3000",     # Dibutuhkan untuk akses camera
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],      # izinkan semua metode HTTP
    allow_headers=["*"],      # izinkan semua header termasuk Authorization
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "TemanIsyarat backend running"}

# 🔄 Endpoint utama aplikasi
app.include_router(detect_router, prefix="/api")

print("\n🚀 TemanIsyarat Backend Loaded with CORS Support\n")
