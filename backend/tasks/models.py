from django.db import models
from django.conf import settings  # Import settings to reference custom User model

class Task(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Assign task to a User
    user_experience = models.IntegerField()  # Experience in years
    task_name = models.CharField(max_length=255)
    task_duration = models.FloatField()  # Duration in days
    task_complexity = models.IntegerField()  # Complexity (1-5)
    story_points = models.FloatField()  # Target variable

    def __str__(self):
        return self.task_name
