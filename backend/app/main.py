from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.detect import router as detect_router

app = FastAPI(title="TemanIsyarat Backend")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "TemanIsyarat backend running"}

app.include_router(detect_router, prefix="/api")
