from fer import FER
import cv2
from collections import Counter
import time
from .models import DailyEmotion
from django.utils import timezone

def detect_emotions(request): # Accept the 'request' parameter
    # Initialize the FER detector and video capture
    detector = FER()
    video_capture = cv2.VideoCapture(0)

    if not video_capture.isOpened():
        return {'error': 'Could not open video.'}
    # Variables to store emotions and start time

    detected_emotions = []
    start_time = time.time()
    duration = 10  # 10 seconds

    while True:
        ret, frame = video_capture.read()
        if not ret:
            return {'error': 'Could not read frame.'}
        # Detect emotions on the current frame
        emotions = detector.detect_emotions(frame)
        for emotion_data in emotions:

            # Check if emotions data exists
            if 'emotions' in emotion_data:
                dominant_emotion = max(emotion_data['emotions'], key=emotion_data['emotions'].get)
                detected_emotions.append(dominant_emotion)

        if time.time() - start_time > duration:
            break

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()
    # Analyze and return the dominant emotion
    if detected_emotions:
        # Count the occurrences of each emotion
        emotion_counter = Counter(detected_emotions)
        most_common_emotion, count = emotion_counter.most_common(1)[0]
        
        # Get today's emotion record or create a new one
        today = timezone.now().date()
        daily_emotion, created = DailyEmotion.objects.get_or_create(
            date=today,
            defaults={
                'first_emotion': '',
                'second_emotion': '',
                'third_emotion': ''
            }
        )

        # Update emotions based on which slots are empty
        if not daily_emotion.first_emotion:
            daily_emotion.first_emotion = most_common_emotion
        elif not daily_emotion.second_emotion:
            daily_emotion.second_emotion = most_common_emotion
        elif not daily_emotion.third_emotion:
            daily_emotion.third_emotion = most_common_emotion

        daily_emotion.save()  # This will trigger the calculate_average_emotion method

        return {
            'emotion': most_common_emotion,
            'count': count,
            'duration': duration,
            'daily_average': daily_emotion.average_emotion
        }
    else:
        return {'error': 'No emotions detected.'}