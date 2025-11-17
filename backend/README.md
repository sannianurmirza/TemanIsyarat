Generated TemanIsyarat backend.

Usage:
cd /mnt/data/temanisyarat_backend_generated
python -m venv env
source env/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
