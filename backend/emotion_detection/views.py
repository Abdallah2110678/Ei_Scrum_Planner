from django.http import JsonResponse
import logging
from .emotion_detection import detect_emotions
from .models import DailyEmotion
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny

# Set up logging
logger = logging.getLogger(__name__)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def emotion_detection_view(request):
    try:
        # Get user from request (will be set by JWTAuthentication if token is valid)
        user = request.user if request.user.is_authenticated else None
        
        # Get request type (LOGIN, LOGOUT, FOLLOWUP)
        request_type = request.query_params.get('type', 'DEFAULT')
        logger.info(f"Emotion detection request type: {request_type} for user: {user}")
        
        # Call emotion detection with the request (which now has authenticated user)
        result = detect_emotions(request)
        
        # Get today's emotions for the response
        today = timezone.now().date()
        
        # Filter daily emotion by authenticated user if available
        filter_params = {'date': today}
        if user and not user.is_anonymous:
            filter_params['user'] = user
            
        daily_emotion = DailyEmotion.objects.filter(**filter_params).first()
        
        if daily_emotion:
            result.update({
                'daily_emotions': {
                    'first_emotion': daily_emotion.first_emotion,
                    'second_emotion': daily_emotion.second_emotion,
                    'third_emotion': daily_emotion.third_emotion,
                    'average_emotion': daily_emotion.average_emotion,
                    'request_type': request_type
                }
            })
            
            # Add user information if available
            if daily_emotion.user:
                result.update({
                    'user': {
                        'id': daily_emotion.user.id,
                        'name': daily_emotion.user.name,
                        'email': daily_emotion.user.email
                    }
                })
        
        return JsonResponse(result)
    except Exception as e:
        logger.error(f"Error in emotion_detection_view: {str(e)}")
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def get_daily_emotions(request):
    try:
        today = timezone.now().date()
        
        # Get user from request (will be set by JWTAuthentication if token is valid)
        user = request.user if request.user.is_authenticated else None
        
        # Filter daily emotion by authenticated user if available
        filter_params = {'date': today}
        if user and not user.is_anonymous:
            filter_params['user'] = user
            
        daily_emotion = DailyEmotion.objects.filter(**filter_params).first()
        
        if daily_emotion:
            response = {
                'date': daily_emotion.date,
                'first_emotion': daily_emotion.first_emotion,
                'second_emotion': daily_emotion.second_emotion,
                'third_emotion': daily_emotion.third_emotion,
                'average_emotion': daily_emotion.average_emotion
            }
            
            # Add user information if available
            if daily_emotion.user:
                response.update({
                    'user': {
                        'id': daily_emotion.user.id,
                        'name': daily_emotion.user.name,
                        'email': daily_emotion.user.email
                    }
                })
                
            return JsonResponse(response)
            
        return JsonResponse({'message': 'No emotions recorded today'}, status=404)
    except Exception as e:
        logger.error(f"Error in get_daily_emotions: {str(e)}")
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)