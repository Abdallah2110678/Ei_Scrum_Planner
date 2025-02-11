from django.db import models
from users.models import User
from tasks.models import Task

class Estimation(models.Model):

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="estimations")  # Link to Task
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="estimations")  # Link to User

    # Unique Estimation-Specific Attributes
    estimation_result = models.FloatField(null=True, blank=True)
    @property
    def developer_name(self):
        """Fetch the developer name from the User model."""
        return self.user.name if self.user else "Unknown Developer"

    @property
    def developer_experience(self):
        """Fetch the developer's experience from the User model."""
        return self.user.experience if self.user else 0

    @property
    def task_name(self):
        """Fetch the task name from the Task model."""
        return self.task.task_name if self.task else "Unknown Task"

    @property
    def task_duration(self):
        """Fetch the task duration from the Task model."""
        return self.task.task_duration if self.task else 0.0

    @property
    def task_complexity(self):
        """Fetch the task complexity from the Task model."""
        return self.task.task_complexity if self.task else 0

    @property
    def story_points(self):
        """Fetch the story points from the Task model."""
        return self.task.story_points if self.task else 0.0
    def calculate_estimation(self):
        """Calculate the estimation result based on task and user attributes."""
        base_estimation = self.task_duration * self.task_complexity
        experience_factor = max(1, 10 - self.developer_experience)  # More experience, less time required
        result = base_estimation / experience_factor  # Removed additional_factor
        return result

    def save(self, *args, **kwargs):
        """Override save method to calculate and store estimation result before saving."""
        self.estimation_result = self.calculate_estimation()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Estimation for {self.task_name} by {self.developer_name}"
