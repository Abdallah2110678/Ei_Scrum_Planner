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
from project_users.models import ProjectUsers
from sprints.models import Sprint

# Set up logging
logger = logging.getLogger(__name__)

@api_view(['GET'])
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
                    'first_emotion_weight': daily_emotion.first_emotion_weight,
                    'second_emotion_weight': daily_emotion.second_emotion_weight,
                    'third_emotion_weight': daily_emotion.third_emotion_weight,
                    'average_emotion_weight': daily_emotion.average_emotion_weight,
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
                'average_emotion': daily_emotion.average_emotion,
                'first_emotion_weight': daily_emotion.first_emotion_weight,
                'second_emotion_weight': daily_emotion.second_emotion_weight,
                'third_emotion_weight': daily_emotion.third_emotion_weight,
                'average_emotion_weight': daily_emotion.average_emotion_weight
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
@permission_classes([AllowAny])
def team_emotions(request):
    try:
        project_id = request.query_params.get('project_id')
        sprint_id = request.query_params.get('sprint_id')
        
        logger.info(f"Fetching team emotions for project_id={project_id}, sprint_id={sprint_id}")

        # Base query with date filter
        from_date = timezone.now().date() - timedelta(days=7)
        query = DailyEmotion.objects.filter(date__gte=from_date)

        # Add filters if parameters are provided
        if project_id:
            # Get all users in the project
            project_users = ProjectUsers.objects.filter(
                project_id=project_id
            ).values_list('user_id', flat=True)
            logger.info(f"Found project users: {list(project_users)}")
            query = query.filter(user_id__in=project_users)

        if sprint_id:
            logger.info(f"Filtering by sprint_id: {sprint_id}")
            query = query.filter(sprint_id=sprint_id)

        # Select related user data to avoid N+1 queries
        emotions = query.select_related('user', 'sprint')
        
        logger.info(f"Found {emotions.count()} emotions")

        result = []
        for emotion in emotions:
            emotion_data = {
                'date': emotion.date,
                'first_emotion': emotion.first_emotion,
                'second_emotion': emotion.second_emotion,
                'third_emotion': emotion.third_emotion,
                'average_emotion': emotion.average_emotion,
                'first_emotion_weight': emotion.first_emotion_weight,
                'second_emotion_weight': emotion.second_emotion_weight,
                'third_emotion_weight': emotion.third_emotion_weight,
                'average_emotion_weight': emotion.average_emotion_weight,
                'sprint_id': emotion.sprint.id if emotion.sprint else None
            }
            
            if emotion.user:
                emotion_data['user'] = {
                    'id': emotion.user.id,
                    'name': emotion.user.name,
                    'email': emotion.user.email
                }
            
            result.append(emotion_data)

        logger.info(f"Returning {len(result)} emotion records")
        return Response(result)
    except Exception as e:
        logger.error(f"Error in team_emotions view: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error', 'detail': str(e)}, 
            status=500
        )