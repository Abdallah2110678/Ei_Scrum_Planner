from django.db import models

class Task(models.Model):
    developer_name = models.CharField(max_length=100)
    developer_experience = models.IntegerField()  # Developer experience in years
    task_name = models.CharField(max_length=255)
    task_duration = models.FloatField()           # Duration in days
    task_complexity = models.IntegerField()       # Complexity score (e.g., 1-5)
    story_points = models.FloatField()            # Target variable (Story Points)

    def __str__(self):
        return self.task_name
