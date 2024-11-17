import subprocess
from django.http import JsonResponse

def detect_emotions(request):
    subprocess.run(["python", "emotion_detection.py"])
    return JsonResponse({"status": "Emotion detection completed"})
