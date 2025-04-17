from django.db import models
from django.conf import settings
from projects.models import Project
from tasks.models import Task
from sprints.models import Sprint

class DeveloperPerformance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, null=True, blank=True)

    category = models.CharField(max_length=50, editable=False)
    complexity = models.CharField(max_length=20, editable=False)

    total_tasks = models.PositiveIntegerField(default=0)
    total_actual_effort = models.FloatField(default=0.0)
    rework_count = models.PositiveIntegerField(default=0)
    rework_effort = models.FloatField(default=0.0)

    productivity = models.FloatField(default=0.0)
    rework_rate = models.FloatField(default=0.0)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'project', 'sprint', 'category', 'complexity')

    def update_from_task(self, task_id, was_reworked=False):
        try:
            task = Task.objects.get(id=task_id)

            self.category = task.task_category
            self.complexity = task.task_complexity

            self.total_tasks += 1
            self.total_actual_effort += task.actual_effort

            if was_reworked:
                self.rework_count += 1
                self.rework_effort += task.actual_effort

            self.rework_rate = self.rework_count / self.total_tasks if self.total_tasks else 0
            self.productivity = self.total_tasks / self.total_actual_effort if self.total_actual_effort else 0

            self.save()

        except Task.DoesNotExist:
            pass

    def get_total_assigned_tasks(self):
        return Task.objects.filter(assigned_to=self.user).count()

    def __str__(self):
        return f"{self.user} | {self.project.name} | Sprint: {self.sprint.name if self.sprint else 'N/A'} | {self.category}-{self.complexity}"
