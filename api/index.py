import sys
import os

# Backend klasörünü path'e ekle
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

from backend.main import app

# Vercel için app handler
handler = app
