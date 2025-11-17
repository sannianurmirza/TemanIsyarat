# ====================================================
#   DUMMY FUNCTIONS AGAR PICKLE TIDAK ERROR
# ====================================================

def auto_contrast(x=None, *args, **kwargs):
    return x

def auto_orient(x=None, *args, **kwargs):
    return x

def dynamic_crop(x=None, *args, **kwargs):
    return x

def resize_image(x=None, *args, **kwargs):
    return x

def filter_null(x=None, *args, **kwargs):
    return x

# ==== FIX UTAMA: MASUKKAN FUNGSI DUMMY KE __main__ ====
import sys
sys.modules['__main__'].auto_contrast = auto_contrast
sys.modules['__main__'].auto_orient = auto_orient
sys.modules['__main__'].dynamic_crop = dynamic_crop
sys.modules['__main__'].resize_image = resize_image
sys.modules['__main__'].filter_null = filter_null


# ====================================================
#   NORMAL CODE MULAI DARI SINI — TIDAK DIUBAH
# ====================================================

import io
import os
import pickle
import torch
import torch.nn.functional as F
from PIL import Image

# ==== PATH HANDLING ====

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(ROOT, "app", "models")

PKL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "preprocess_pipeline.pkl")
)

# ==== LOAD PIPELINE ==== 

with open(PKL_PATH, "rb") as f:
    pipeline = pickle.load(f)


# ====================================================
#   MODEL LOADING
# ====================================================

def try_torch_load(path):
    try:
        return torch.load(path, map_location="cpu", weights_only=False)
    except Exception as e:
        raise RuntimeError(f"❌ Gagal memuat model {path}: {e}")


def load_models():
    models = {}
    labels = None

    full_path = os.path.join(MODELS_DIR, "alexnet_best_full.pth")
    words_path = os.path.join(MODELS_DIR, "alexnet_best_words.pth")
    prep1 = os.path.join(MODELS_DIR, "preprocessing.pkl")
    prep2 = os.path.join(MODELS_DIR, "preprocess_pipeline.pkl")

    if os.path.exists(full_path):
        models["full"] = try_torch_load(full_path)

    if os.path.exists(words_path):
        models["words"] = try_torch_load(words_path)

    pipeline_local = None
    if os.path.exists(prep2):
        with open(prep2, "rb") as f:
            pipeline_local = pickle.load(f)
    elif os.path.exists(prep1):
        with open(prep1, "rb") as f:
            pipeline_local = pickle.load(f)

    if pipeline_local is not None and hasattr(pipeline_local, "classes_"):
        labels = list(pipeline_local.classes_)
    else:
        labels = [f"class_{i}" for i in range(26)]

    print(f"✅ Models loaded: {list(models.keys())}")
    print(f"✅ Labels found: {len(labels)} classes")

    return models, pipeline_local, labels


# ====================================================
#   IMAGE PREPARATION
# ====================================================

def prepare_image(image_bytes, size=224):
    from torchvision import transforms

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    transform = transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    return transform(image).unsqueeze(0)


# ====================================================
#   PREDICTION
# ====================================================

def predict_from_image(image_bytes, models, pipeline, labels, model_name="full", top_k=3):

    if model_name not in models:
        raise ValueError(f"❌ Model '{model_name}' tidak ditemukan. Pilihan: {list(models.keys())}")

    model = models[model_name]
    model.eval()

    tensor = prepare_image(image_bytes)

    with torch.no_grad():
        outputs = model(tensor)
        probs = F.softmax(outputs, dim=1).squeeze(0).cpu().numpy()

    top_idx = probs.argsort()[-top_k:][::-1]

    results = []
    for idx in top_idx:
        label = labels[idx] if idx < len(labels) else f"class_{idx}"
        results.append({
            "letter": label,
            "confidence": float(probs[idx] * 100)
        })

    return {
        "prediction": results[0]["letter"],
        "confidence": results[0]["confidence"],
        "all_predictions": results
    }
