from fer import FER
import cv2
from collections import Counter
import time
from .models import DailyEmotion
from django.utils import timezone
from django.contrib.auth import get_user_model

def detect_emotions(request):
    # Get user from request if authenticated
    user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
    
    # Get request type (LOGIN, LOGOUT, FOLLOWUP)
    request_type = request.GET.get('type', 'DEFAULT')
    
    detector = FER()
    video_capture = cv2.VideoCapture(0)
    if not video_capture.isOpened():
        return {'error': 'Could not open video.'}
    detected_emotions = []
    start_time = time.time()
    duration = 10  # 10 seconds
    while True:
        ret, frame = video_capture.read()
        if not ret:
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
            # Get or create daily emotion for this user
            daily_emotion, created = DailyEmotion.objects.get_or_create(
                date=today,
                user=user,
                defaults={
                    'first_emotion': '',
                    'second_emotion': '',
                    'third_emotion': ''
                }
            )
            
            # Update the appropriate emotion field based on request type
            if request_type == 'LOGIN' or (created and not daily_emotion.first_emotion):
                # For login or first detection of the day
                if not daily_emotion.first_emotion:
                    daily_emotion.first_emotion = most_common_emotion
                    daily_emotion.save()
            elif request_type == 'LOGOUT':
                # For logout, update the third emotion if empty, otherwise update second
                if not daily_emotion.third_emotion:
                    daily_emotion.third_emotion = most_common_emotion
                    daily_emotion.save()
                elif not daily_emotion.second_emotion:
                    daily_emotion.second_emotion = most_common_emotion
                    daily_emotion.save()
            elif request_type == 'FOLLOWUP':
                # For followup (scheduled detection), update second emotion if empty
                if not daily_emotion.second_emotion:
                    daily_emotion.second_emotion = most_common_emotion
                    daily_emotion.save()
            else:
                # Default behavior - fill in the first empty slot
                if not daily_emotion.first_emotion:
                    daily_emotion.first_emotion = most_common_emotion
                elif not daily_emotion.second_emotion:
                    daily_emotion.second_emotion = most_common_emotion
                elif not daily_emotion.third_emotion:
                    daily_emotion.third_emotion = most_common_emotion
                daily_emotion.save()
        
        response = {
            'emotion': most_common_emotion,
            'count': count,
            'duration': duration,
            'request_type': request_type
        }
        
        # Add daily average emotion if available
        if daily_emotion:
            response['daily_average'] = daily_emotion.average_emotion
            
            # Add user information to response if user exists
            if user:
                response['user'] = {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email
                }
            
        return response
    else:
        return {'error': 'No emotions detected.'}