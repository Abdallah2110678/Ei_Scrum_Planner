from django.conf import settings
from django.db import models

class Project(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_projects",
        null=True,  # Optional: allows projects without a creator (e.g., for existing data)
        blank=True
    )
    
    def __str__(self):
        return self.name
