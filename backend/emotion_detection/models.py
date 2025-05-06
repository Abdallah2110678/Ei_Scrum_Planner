from django.db import models
from django.conf import settings
from sprints.models import Sprint
class DailyEmotion(models.Model):
    # Static emotion-to-weight mapping defined within the model
    EMOTION_WEIGHTS = {
        'happy': 0.8,
        'neutral': 0.5,
        'sad': 0.2,
        'angry': 0.3,
        'surprise': 0.6,
        'fear': 0.4,
        'disgust': 0.3
    }

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='daily_emotions'
    )
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name="daily_emotions")
    date = models.DateField(auto_now_add=True)
    first_emotion = models.CharField(max_length=50, blank=True)
    second_emotion = models.CharField(max_length=50, blank=True)
    third_emotion = models.CharField(max_length=50, blank=True)
    average_emotion = models.CharField(max_length=50, blank=True)
    first_emotion_weight = models.FloatField(null=True, blank=True)
    second_emotion_weight = models.FloatField(null=True, blank=True)
    third_emotion_weight = models.FloatField(null=True, blank=True)
    average_emotion_weight = models.FloatField(null=True, blank=True)

    def calculate_average_emotion(self):
        emotions = [self.first_emotion, self.second_emotion, self.third_emotion]
        # Filter out empty emotions
        valid_emotions = [e for e in emotions if e]
        
        # Assign weights based on EMOTION_WEIGHTS
        self.first_emotion_weight = self.EMOTION_WEIGHTS.get(self.first_emotion, 0.0) if self.first_emotion else None
        self.second_emotion_weight = self.EMOTION_WEIGHTS.get(self.second_emotion, 0.0) if self.second_emotion else None
        self.third_emotion_weight = self.EMOTION_WEIGHTS.get(self.third_emotion, 0.0) if self.third_emotion else None
        
        if valid_emotions:
            # Set average emotion as the most common emotion
            self.average_emotion = max(set(valid_emotions), key=valid_emotions.count)
            # Calculate average weight from valid weights
            valid_weights = [
                w for w in [self.first_emotion_weight, self.second_emotion_weight, self.third_emotion_weight]
                if w is not None
            ]
            self.average_emotion_weight = sum(valid_weights) / len(valid_weights) if valid_weights else 0.0
        else:
            self.average_emotion = ''
            self.average_emotion_weight = None

    def save(self, *args, **kwargs):
        self.calculate_average_emotion()
        super().save(*args, **kwargs)

    def __str__(self):
        username = self.user.name if self.user else 'Anonymous'
        return f"Emotions for {username} on {self.date}: {self.average_emotion} (Weight: {self.average_emotion_weight or 'N/A'})"

    class Meta:
        unique_together = ['user', 'date']  # Ensure one record per user per day