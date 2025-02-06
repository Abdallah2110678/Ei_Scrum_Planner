from django.http import JsonResponse
from .emotion_detection import detect_emotions

def emotion_detection_view(request):
    if request.method == 'GET':
        result = detect_emotions(request)
        return JsonResponse(result)
    return JsonResponse({'error': 'Invalid request method'}, status=400)