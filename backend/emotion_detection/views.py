from django.http import JsonResponse
import logging
from .emotion_detection import detect_emotions
from .models import DailyEmotion
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from datetime import timedelta
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
    
    # Add this to your views.py in the emotion_detection app

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def team_emotions(request):
    """
    Get emotions for all team members (for dashboard display)
    """
    try:
        # Get authenticated user
        user = request.user
        
        # Admin or manager role check could be added here
        
        # Query for all daily emotions from the last 7 days 
        # (you can adjust the timeframe as needed)
        from_date = timezone.now().date() - timezone.timedelta(days=7)
        
        # Get emotions for all users
        emotions = DailyEmotion.objects.filter(
            date__gte=from_date
        ).select_related('user')
        
        # Prepare response data
        result = []
        for emotion in emotions:
            emotion_data = {
                'date': emotion.date,
                'first_emotion': emotion.first_emotion,
                'second_emotion': emotion.second_emotion,
                'third_emotion': emotion.third_emotion,
                'average_emotion': emotion.average_emotion,
            }
            
            # Add user information if available
            if emotion.user:
                emotion_data['user'] = {
                    'id': emotion.user.id,
                    'name': emotion.user.name,
                    'email': emotion.user.email
                }
                emotion_data['user_email'] = emotion.user.email
            else:
                emotion_data['user_email'] = 'Anonymous'
            
            result.append(emotion_data)
        
        return Response(result)
    except Exception as e:
        logger.error(f"Error in team_emotions view: {str(e)}")
        return Response({'error': f'Internal server error: {str(e)}'}, status=500)