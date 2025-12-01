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
#   IMPORTS
# ====================================================

import io
import os
import pickle
import torch
import torch.nn.functional as F
from PIL import Image


# ====================================================
#   LABEL DEFINITIONS - SESUAI URUTAN FOLDER DATASET
# ====================================================

# 26 Huruf (A-Z) - Urut Alphabetical
LABELS_HURUF = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z'
]

# 104 Kata - Sesuai urutan folder dataset Anda
LABELS_KATA = [
    'Adik_P', 'Air', 'Aku', 'Anda', 'Anjing', 'Awalan', 'Awan', 'Ayah', 'Ayam', 'Baca',
    'Bangun', 'Baru', 'Berat', 'Besar', 'Burung', 'Cepat', 'Cerah', 'Danau', 'Dengan', 'Doa',
    'Foto', 'Gelap', 'Gunung', 'Guru', 'Hari', 'Hujan', 'Hutan', 'Ibu', 'Ini',
    'Itu', 'Jam', 'Jendela', 'Jumat', 'Kakak', 'Kamis', 'Kamu', 'Kecil', 'Kelinci', 'Kenyang',
    'Kereta', 'Kerja', 'Kertas', 'Kipas', 'Kita', 'Kolam', 'Kucing', 'Kuda', 'Kursi', 'Lama',
    'Lambat', 'Lapar', 'Lihat', 'Mahal', 'Main', 'Makan', 'Malam', 'Masak', 'Matahari', 'Meja',
    'Mendung', 'Mereka', 'Minggu', 'Minum', 'Mobil', 'Motor', 'Murah', 'Musuh', 'Pagi', 'Panjang',
    'Papan', 'Pendek', 'Pensil', 'Pesawat', 'Pintu', 'Polisi', 'Pulpen', 'Rabu', 'Ringan', 'Roti',
    'Rumah', 'Rumput', 'Sabtu', 'Sama', 'Sapi', 'Sawah', 'Saya', 'Sedang', 'Selasa', 'Senin',
    'Senyum', 'Sore', 'Suasana', 'Sungai', 'Takut', 'Telepon', 'Teman', 'Tentara', 'Terang', 'Tugas',
    'Tulis', 'Tunjuk', 'Ular'
]


# ====================================================
#   PATH HANDLING
# ====================================================

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(ROOT, "app", "models")


# ====================================================
#   MODEL LOADING
# ====================================================

def try_torch_load(path):
    """Load PyTorch model dengan error handling"""
    try:
        return torch.load(path, map_location="cpu", weights_only=False)
    except Exception as e:
        raise RuntimeError(f"❌ Gagal memuat model {path}: {e}")


def load_models():
    """
    Load model huruf dan kata dengan label mapping yang benar
    
    Returns:
        models: dict berisi model {'full': model_huruf, 'words': model_kata}
        pipeline: preprocessing pipeline (legacy, tidak digunakan)
        labels_map: dict mapping model_name ke list labels
    """
    models = {}
    labels_map = {}

    full_path = os.path.join(MODELS_DIR, "alexnet_best_full.pth")
    words_path = os.path.join(MODELS_DIR, "alexnet_best_words.pth")

    # Load model huruf (A-Z)
    if os.path.exists(full_path):
        models["full"] = try_torch_load(full_path)
        labels_map["full"] = LABELS_HURUF
        print(f"✅ Model HURUF loaded: {len(LABELS_HURUF)} classes (A-Z)")
    else:
        print(f"⚠️ Model huruf tidak ditemukan: {full_path}")

    # Load model kata (104 kata SIBI)
    if os.path.exists(words_path):
        models["words"] = try_torch_load(words_path)
        labels_map["words"] = LABELS_KATA
        print(f"✅ Model KATA loaded: {len(LABELS_KATA)} classes")
    else:
        print(f"⚠️ Model kata tidak ditemukan: {words_path}")

    # Fallback: coba load preprocessing pipeline (legacy support)
    pipeline_local = None
    prep2 = os.path.join(MODELS_DIR, "preprocess_pipeline.pkl")
    prep1 = os.path.join(MODELS_DIR, "preprocessing.pkl")
    
    if os.path.exists(prep2):
        try:
            with open(prep2, "rb") as f:
                pipeline_local = pickle.load(f)
            print("✅ Pipeline preprocessing loaded")
        except Exception as e:
            print(f"⚠️ Gagal load pipeline: {e}")
    elif os.path.exists(prep1):
        try:
            with open(prep1, "rb") as f:
                pipeline_local = pickle.load(f)
            print("✅ Pipeline preprocessing loaded")
        except Exception as e:
            print(f"⚠️ Gagal load pipeline: {e}")

    return models, pipeline_local, labels_map


# ====================================================
#   IMAGE PREPARATION
# ====================================================

def prepare_image(image_bytes, size=224):
    """
    Preprocess image untuk model AlexNet
    
    Args:
        image_bytes: bytes dari image
        size: ukuran target (default 224x224 untuk AlexNet)
    
    Returns:
        tensor: torch.Tensor siap untuk inference
    """
    from torchvision import transforms

    # Load image dan convert ke RGB
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Transform standar ImageNet (digunakan AlexNet)
    transform = transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],  # ImageNet mean
            std=[0.229, 0.224, 0.225]     # ImageNet std
        )
    ])

    return transform(image).unsqueeze(0)  # Add batch dimension


# ====================================================
#   PREDICTION
# ====================================================

def predict_from_image(image_bytes, models, pipeline, labels_map, model_name="full", top_k=3):
    """
    Predict bahasa isyarat dari image
    
    Args:
        image_bytes: bytes dari image
        models: dict berisi model
        pipeline: preprocessing pipeline (tidak digunakan, untuk backward compatibility)
        labels_map: dict mapping model_name -> list of labels
        model_name: "full" untuk huruf (A-Z), "words" untuk kata (104 kata)
        top_k: jumlah top predictions yang dikembalikan
    
    Returns:
        dict: {
            "prediction": label teratas,
            "confidence": confidence teratas (0-100),
            "all_predictions": list semua top-k predictions,
            "model_used": nama model yang digunakan,
            "total_classes": jumlah total classes
        }
    """
    
    # Validasi model tersedia
    if model_name not in models:
        available = list(models.keys())
        raise ValueError(
            f"❌ Model '{model_name}' tidak ditemukan. "
            f"Model tersedia: {available}"
        )

    # Validasi label mapping tersedia
    if model_name not in labels_map:
        raise ValueError(f"❌ Label mapping untuk '{model_name}' tidak ditemukan")

    # Get model dan labels
    model = models[model_name]
    labels = labels_map[model_name]
    
    print(f"\n{'='*50}")
    print(f"🔍 Melakukan deteksi dengan model: {model_name.upper()}")
    print(f"📊 Total classes: {len(labels)}")
    print(f"{'='*50}")
    
    # Set model ke eval mode
    model.eval()

    # Preprocess image
    tensor = prepare_image(image_bytes)
    print(f"✅ Image preprocessed: shape {tensor.shape}")

    # Inference
    with torch.no_grad():
        outputs = model(tensor)
        probs = F.softmax(outputs, dim=1).squeeze(0).cpu().numpy()

    # Validasi output model sesuai dengan jumlah label
    if len(probs) != len(labels):
        print(f"\n⚠️  WARNING: MISMATCH DETECTED!")
        print(f"   Model output: {len(probs)} classes")
        print(f"   Label mapping: {len(labels)} classes")
        print(f"   Pastikan model di-train dengan {len(labels)} classes!")
        print(f"{'='*50}\n")

    # Get top-k predictions
    top_idx = probs.argsort()[-top_k:][::-1]

    results = []
    print(f"\n📈 Top-{top_k} Predictions:")
    print("-" * 50)
    
    for rank, idx in enumerate(top_idx, 1):
        if idx < len(labels):
            label = labels[idx]
            confidence = float(probs[idx] * 100)
            results.append({
                "letter": label,
                "confidence": confidence
            })
            print(f"  {rank}. {label:15s} → {confidence:5.2f}%")
        else:
            print(f"  {rank}. Index {idx} out of range (max: {len(labels)-1})")

    print("-" * 50)

    if not results:
        raise ValueError("❌ Tidak ada hasil prediksi yang valid")

    # Return hasil prediksi
    result = {
        "prediction": results[0]["letter"],
        "confidence": results[0]["confidence"],
        "all_predictions": results,
        "model_used": model_name,
        "total_classes": len(labels)
    }
    
    print(f"\n✅ HASIL AKHIR: {result['prediction']} ({result['confidence']:.2f}%)")
    print(f"{'='*50}\n")
    
    return result