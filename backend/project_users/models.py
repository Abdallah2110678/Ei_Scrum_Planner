from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from projects.models import Project
import uuid

class ProjectUsers(models.Model):
    """
    Model representing the relationship between a user and a project.
    Includes points and a badge system.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_participations")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_users")
    points = models.PositiveIntegerField(default=0)  # Tracks user points in a project
    badges = models.TextField(blank=True, null=True)  # Stores badges as comma-separated values

    class Meta:
        unique_together = ('user', 'project')  # Ensures a user is linked to a project only once

    def __str__(self):
        return f"{self.user.name} - {self.project.name} ({self.points} Points)"

    def add_points(self, amount):
        """Increase the user's points for this project."""
        self.points += amount
        self.save()

    def add_badge(self, badge):
        """Add a badge to the user for this project, ensuring no duplicates."""
        current_badges = self.get_badges_list()
        if badge not in current_badges:
            current_badges.append(badge)
            self.badges = ",".join(current_badges)
            self.save()

    def get_badges_list(self):
        """Retrieve badges as a list."""
        return self.badges.split(",") if self.badges else []

    def has_badge(self, badge):
        """Check if the user has a specific badge."""
        return badge in self.get_badges_list()
    


class Invitation(models.Model):
    email = models.EmailField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="invitations")
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)

    def __str__(self):
        return f"Invitation for {self.email} to {self.project.name}"
