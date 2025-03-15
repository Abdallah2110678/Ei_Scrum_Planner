from django.db import models
from django.conf import settings
from sprints.models import Sprint
from projects.models import Project

class Task(models.Model):
    STATUS_CHOICES = [
        ("TO DO", "To Do"),
        ("IN PROGRESS", "In Progress"),
        ("DONE", "Done"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)
    task_name = models.CharField(max_length=255)
    task_duration = models.FloatField()
    task_complexity = models.IntegerField()
    story_points = models.FloatField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="TO DO")

    @property
    def user_experience(self):
        """Fetch experience from the User model."""
        return self.user.experience if self.user else None

    def __str__(self):
        return self.task_name
