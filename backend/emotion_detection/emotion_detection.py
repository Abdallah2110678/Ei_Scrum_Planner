from fer import FER
import cv2
from collections import Counter
import time
from .models import DailyEmotion
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging

# Set up logging
logger = logging.getLogger(__name__)

def detect_emotions(request):
    # Get user from request if authenticated
    user = request.user if hasattr(request, 'user') and request.user.is_authenticated and not request.user.is_anonymous else None
    
    # Get request type (LOGIN, LOGOUT, FOLLOWUP)
    request_type = request.GET.get('type', 'DEFAULT')
    logger.info(f"Detecting emotions for request type: {request_type}, user authenticated: {user is not None}")
    
    detector = FER()
    video_capture = cv2.VideoCapture(0)
    if not video_capture.isOpened():
        logger.error("Could not open video capture device")
        return {'error': 'Could not open video.'}
    
    detected_emotions = []
    start_time = time.time()
    duration = 10
    while True:
        ret, frame = video_capture.read()
        if not ret:
            logger.error("Could not read frame from video capture device")
            return {'error': 'Could not read frame.'}
        emotions = detector.detect_emotions(frame)
        for emotion_data in emotions:
            if 'emotions' in emotion_data:
                dominant_emotion = max(emotion_data['emotions'], key=emotion_data['emotions'].get)
                detected_emotions.append(dominant_emotion)
        if time.time() - start_time > duration:
            break
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    video_capture.release()
    cv2.destroyAllWindows()
    
    if detected_emotions:
        emotion_counter = Counter(detected_emotions)
        most_common_emotion, count = emotion_counter.most_common(1)[0]
        today = timezone.now().date()
        
        # Get or create daily emotion with user association
        daily_emotion = None
        
        if user:
            logger.info(f"User authenticated, associating emotion with user: {user.email}")
            # Get or create daily emotion for this user
            try:
                daily_emotion, created = DailyEmotion.objects.get_or_create(
                    date=today,
                    user=user,
                    defaults={
                        'first_emotion': '',
                        'second_emotion': '',
                        'third_emotion': ''
                    }
                )
                
                # Update emotion and weight based on request type
                if request_type == 'LOGIN' or (created and not daily_emotion.first_emotion):
                    if not daily_emotion.first_emotion:
                        daily_emotion.first_emotion = most_common_emotion
                        daily_emotion.first_emotion_weight = DailyEmotion.EMOTION_WEIGHTS.get(most_common_emotion, 0.0)
                        daily_emotion.save()
                elif request_type == 'LOGOUT':
                    # For logout, update the third emotion if empty, otherwise update second
                    if not daily_emotion.third_emotion:
                        daily_emotion.third_emotion = most_common_emotion
                        daily_emotion.third_emotion_weight = DailyEmotion.EMOTION_WEIGHTS.get(most_common_emotion, 0.0)
                        daily_emotion.save()
                    elif not daily_emotion.second_emotion:
                        daily_emotion.second_emotion = most_common_emotion
                        daily_emotion.second_emotion_weight = DailyEmotion.EMOTION_WEIGHTS.get(most_common_emotion, 0.0)
                        daily_emotion.save()
                elif request_type == 'FOLLOWUP':
                    # For followup (scheduled detection), update second emotion if empty
                    if not daily_emotion.second_emotion:
                        daily_emotion.second_emotion = most_common_emotion
                        daily_emotion.second_emotion_weight = DailyEmotion.EMOTION_WEIGHTS.get(most_common_emotion, 0.0)
                        daily_emotion.save()
                else:
                    # Default behavior - fill in the first empty slot
                    if not daily_emotion.first_emotion:
                        daily_emotion.first_emotion = most_common_emotion
                        daily_emotion.first_emotion_weight = DailyEmotion.EMOTION_WEIGHTS.get(most_common_emotion, 0.0)
                    elif not daily_emotion.second_emotion:
                        daily_emotion.second_emotion = most_common_emotion
                        daily_emotion.second_emotion_weight = DailyEmotion.EMOTION_WEIGHTS.get(most_common_emotion, 0.0)
                    elif not daily_emotion.third_emotion:
                        daily_emotion.third_emotion = most_common_emotion
                        daily_emotion.third_emotion_weight = DailyEmotion.EMOTION_WEIGHTS.get(most_common_emotion, 0.0)
                    daily_emotion.save()
            except Exception as e:
                logger.error(f"Error saving emotion for user {user.email}: {str(e)}")
        else:
            logger.info("No authenticated user, emotion will not be associated with any user")
        
        response = {
            'emotion': most_common_emotion,
            'count': count,
            'duration': duration,
            'request_type': request_type
        }
        
        # Add daily average emotion if available
        if daily_emotion:
            response['daily_average'] = daily_emotion.average_emotion
            response['daily_average_weight'] = daily_emotion.average_emotion_weight
            if user:
                response['user'] = {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email
                }
            
        return response
    else:
        logger.warning("No emotions detected in the video stream")
        return {'error': 'No emotions detected.'}