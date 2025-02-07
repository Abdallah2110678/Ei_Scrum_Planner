from django.http import JsonResponse
from django.views.decorators.http import require_GET
import logging
from .emotion_detection import detect_emotions
from .models import DailyEmotion
from django.utils import timezone

# Set up logging
logger = logging.getLogger(__name__)

@require_GET
def emotion_detection_view(request):
    try:
        result = detect_emotions(request)
        
        # Get today's emotions for the response
        today = timezone.now().date()
        daily_emotion = DailyEmotion.objects.filter(date=today).first()
        
        if daily_emotion:
            result.update({
                'daily_emotions': {
                    'first_emotion': daily_emotion.first_emotion,
                    'second_emotion': daily_emotion.second_emotion,
                    'third_emotion': daily_emotion.third_emotion,
                    'average_emotion': daily_emotion.average_emotion
                }
            })
        
        return JsonResponse(result)
    except Exception as e:
        logger.error(f"Error in emotion_detection_view: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)

@require_GET
def get_daily_emotions(request):
    try:
        today = timezone.now().date()
        daily_emotion = DailyEmotion.objects.filter(date=today).first()
        
        if daily_emotion:
            return JsonResponse({
                'date': daily_emotion.date,
                'first_emotion': daily_emotion.first_emotion,
                'second_emotion': daily_emotion.second_emotion,
                'third_emotion': daily_emotion.third_emotion,
                'average_emotion': daily_emotion.average_emotion
            })
        return JsonResponse({'message': 'No emotions recorded today'}, status=404)
    except Exception as e:
        logger.error(f"Error in get_daily_emotions: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)