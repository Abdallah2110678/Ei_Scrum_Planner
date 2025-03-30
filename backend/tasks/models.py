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

    TASK_CATEGORY_CHOICES = [
        ("FE", "Frontend"),
        ("BE", "Backend"),
        ("REWORK", "Rework"),
        ("DEVOPS", "DevOps"),
        ("TESTING", "Testing"),
    ]

    COMPLEXITY_CHOICES = [
        ("EASY", "Easy"),
        ("MEDIUM", "Medium"),
        ("HARD", "Hard"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)

    task_name = models.CharField(max_length=255)
    task_category = models.CharField(max_length=10, choices=TASK_CATEGORY_CHOICES, default="FE")
    task_complexity = models.CharField(max_length=10, choices=COMPLEXITY_CHOICES, default="MEDIUM") 
    effort = models.FloatField(default=1.0)
    priority = models.IntegerField(default=1)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="TO DO")

    @property
    def productivity_score(self):
        """Calculates the productivity score (Actual Effort / Estimated Effort)"""
        if self.actual_effort and self.estimated_effort:
            return self.actual_effort / self.estimated_effort
        return None

    def __str__(self):
        return self.task_name
