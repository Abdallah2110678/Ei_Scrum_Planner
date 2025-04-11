from django.db import models
from django.conf import settings
from projects.models import Project
from tasks.models import Task

class DeveloperPerformance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    category = models.CharField(max_length=50, editable=False)
    complexity = models.CharField(max_length=20, editable=False)

    total_tasks = models.PositiveIntegerField(default=0)
    total_actual_effort = models.FloatField(default=0.0)
    rework_count = models.PositiveIntegerField(default=0)

    productivity = models.FloatField(default=0.0)
    rework_rate = models.FloatField(default=0.0)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'project', 'category', 'complexity')

    def update_from_task(self, task_id, was_reworked=False, reference_effort=Task.actual_effort):
        try:
            task = Task.objects.get(id=task_id)

            self.category = task.task_category
            self.complexity = task.task_complexity

            self.total_tasks += 1
            self.total_actual_effort += task.actual_effort
            
            if was_reworked:
                self.rework_count += 1

            self.rework_rate = self.rework_count / self.total_tasks

            self.productivity = reference_effort

            self.save()

        except Task.DoesNotExist:
            pass

    def __str__(self):
        return f"{self.user} | {self.project.name} | {self.category}-{self.complexity}"


# Create your models here.
