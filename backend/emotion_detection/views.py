from django.http import JsonResponse
from .emotion_detection import detect_emotions  # Import the function from your script

def detect_emotions_view(request):  # Rename the function
    if request.method == 'GET':
        result = detect_emotions(request)  # Call the emotion detection function
        return JsonResponse(result)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)