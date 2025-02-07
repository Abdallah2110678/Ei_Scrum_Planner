from django.db import models
from django.conf import settings

class DailyEmotion(models.Model):
    date = models.DateField(auto_now_add=True)
    first_emotion = models.CharField(max_length=50)
    second_emotion = models.CharField(max_length=50)
    third_emotion = models.CharField(max_length=50)
    average_emotion = models.CharField(max_length=50)

    def calculate_average_emotion(self):
        emotions = [self.first_emotion, self.second_emotion, self.third_emotion]
        # Filter out empty emotions
        valid_emotions = [e for e in emotions if e]
        if valid_emotions:
            # Return the most common emotion
            self.average_emotion = max(set(valid_emotions), key=valid_emotions.count)
        else:
            self.average_emotion = ''

    def save(self, *args, **kwargs):
        self.calculate_average_emotion()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Emotions on {self.date}: {self.average_emotion}"
