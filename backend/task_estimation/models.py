from django.db import models
from users.models import User
from tasks.models import Task

class Estimation(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="estimations")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="estimations")
    estimated_effort = models.FloatField(null=True, blank=True)
    productivity = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Estimation for '{self.task.task_name}' by {self.user.name}"

    @property
    def task_name(self):
        return self.task.task_name

    @property
    def task_category(self):
        return self.task.task_category

    @property
    def task_complexity(self):
        return self.task.task_complexity