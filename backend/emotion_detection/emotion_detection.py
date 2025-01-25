from fer import FER
import cv2
from collections import Counter
import time

def detect_emotions(request):  # Accept the 'request' parameter
    # Initialize the FER detector and video capture
    detector = FER()
    video_capture = cv2.VideoCapture(0)

    if not video_capture.isOpened():
        return {'error': 'Could not open video.'}

    # Variables to store emotions and start time
    detected_emotions = []
    start_time = time.time()
    duration = 10  # 10 seconds

    print("Starting emotion detection for 10 seconds...")

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

        # Show the frame with a note that emotions are being detected
        cv2.putText(frame, "Detecting emotions...", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.imshow("Emotion Detection", frame)

        # Break after 10 seconds
        if time.time() - start_time > duration:
            break

        # Exit early if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the video capture and close OpenCV windows
    video_capture.release()
    cv2.destroyAllWindows()

    # Analyze and return the dominant emotion
    if detected_emotions:
        # Count the occurrences of each emotion
        emotion_counter = Counter(detected_emotions)
        most_common_emotion, count = emotion_counter.most_common(1)[0]
        return {
            'emotion': most_common_emotion,
            'count': count,
            'duration': duration
        }
    else:
        return {'error': 'No emotions detected.'}