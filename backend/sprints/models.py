from venv import logger
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save
from projects.models import Project
from datetime import timedelta
from django.utils.timezone import now
from django.utils import timezone

class Sprint(models.Model):
    DURATION_CHOICES = [
        (7, "1 week"),
        (14, "2 weeks"),
        (21, "3 weeks"),
        (28, "4 weeks"),
        (0, "Custom"),
    ]

    sprint_name = models.CharField(max_length=100)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="sprints")
    duration = models.IntegerField(choices=DURATION_CHOICES, default=14, blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    sprint_goal = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.is_completed:
            if self.start_date and self.duration > 0:
                self.end_date = self.start_date + timedelta(days=self.duration)
            
            current_time = timezone.now()
            if self.end_date and self.end_date < current_time and self.is_active:
                self.auto_complete_sprint()
            elif self.start_date and self.end_date:
                self.is_active = self.start_date <= current_time <= self.end_date
            else:
                self.is_active = False
                
        super().save(*args, **kwargs)
    
    def auto_complete_sprint(self):
        self.is_completed = True
        self.is_active = False
        
    def complete_sprint(self):
        self.is_completed = True
        self.end_date = timezone.now()  
        self.is_active = False
        self.save()

    def __str__(self):
        return f"{self.sprint_name} (Project: {self.project.name})"


@receiver(post_save, sender=Sprint)
def update_project_sprint_completion(sender, instance, **kwargs):
    if instance.is_completed:
        project = instance.project
        completed_sprints_count = project.sprints.filter(is_completed=True).count()
        project.enable_automation = completed_sprints_count >= 2
        project.save(update_fields=['enable_automation'])
        logger.info(f"Updated project {project.name}: enable_automation={project.enable_automation}")