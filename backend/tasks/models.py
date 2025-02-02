from django.db import models
from django.conf import settings

class Task(models.Model):
    STATUS_CHOICES = [
        ("TO DO", "To Do"),
        ("IN PROGRESS", "In Progress"),
        ("DONE", "Done"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Assign task to a User
    user_experience = models.IntegerField()  # Experience in years
    task_name = models.CharField(max_length=255)
    task_duration = models.FloatField()  # Duration in days
    task_complexity = models.IntegerField()  # Complexity (1-5)
    story_points = models.FloatField()  # Target variable
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="TO DO")  # New status field

    def __str__(self):
        return self.task_name
