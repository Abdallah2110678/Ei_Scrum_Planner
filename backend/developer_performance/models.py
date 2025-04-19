# developer_performance/models.py

from django.db import models
from django.conf import settings
from projects.models import Project
from sprints.models import Sprint

class DeveloperPerformance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    category = models.CharField(max_length=50)
    complexity = models.CharField(max_length=10)

    total_tasks = models.PositiveIntegerField(default=0)
    total_actual_effort = models.FloatField(default=0.0)
    productivity = models.FloatField(default=0.0)

    updated_at = models.DateTimeField(auto_now=True)

class Meta:
    unique_together = ('user', 'sprint', 'project', 'category', 'complexity')
