from django.db import models

# Create your models here.

class DailyEmotion(models.Model):
    date = models.DateField(auto_now_add=True)
    first_emotion = models.CharField(max_length=50)
    second_emotion = models.CharField(max_length=50)
    third_emotion = models.CharField(max_length=50)
    average_emotion = models.CharField(max_length=50)

    def calculate_average_emotion(self):
        # Logic to calculate the average emotion
        emotions = [self.first_emotion, self.second_emotion, self.third_emotion]
        # Example logic: return the most common emotion
        self.average_emotion = max(set(emotions), key=emotions.count)
        self.save()

    def save(self, *args, **kwargs):
        self.calculate_average_emotion()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Emotions on {self.date}: {self.average_emotion}"
