# tasks/models.py
import logging
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from sprints.models import Sprint
from projects.models import Project
import threading

from django.db.models.signals import pre_save


_local = threading.local()



logger = logging.getLogger(__name__)

class Task(models.Model):
    STATUS_CHOICES = [
        ("TO DO", "To Do"),
        ("IN PROGRESS", "In Progress"),
        ("DONE", "Done"),
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
    task_category = models.CharField(max_length=50, default="Frontend")
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
    

@receiver(pre_save, sender=Task)
def cache_old_user(sender, instance, **kwargs):
    if instance.id:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            _local.old_user = old_instance.user
        except Task.DoesNotExist:
            _local.old_user = None
    else:
        _local.old_user = None



@receiver(post_save, sender=Task)
def send_task_assignment_email(sender, instance, created, **kwargs):
    new_user = instance.user
    old_user = getattr(_local, 'old_user', None)

    logger.info(f"Task {instance.id} saved. Created: {created}, Old User: {old_user}, New User: {new_user}")

    should_send_email = (old_user != new_user and new_user and new_user.email)

    if should_send_email:
        subject = f"Task Assigned"
        from_email = f"Ei Scrum Team <{settings.DEFAULT_FROM_EMAIL}>"
        to_email = [new_user.email]

        context = {
            'user_name': getattr(new_user, 'name', new_user.email),
            'task_name': instance.task_name,
            'project_name': instance.project.name if instance.project else "No Project",
            'sprint_name': instance.sprint.sprint_name if instance.sprint else "No Sprint",
            'task_url': f"{settings.FRONTEND_URL}/tasks/{instance.id}",
        }

        try:
            html_content = render_to_string('email/task_assignment.html', context)
            text_content = (
                f"Hi {context['user_name']},\n\n"
                f"You’ve been assigned to the task '{instance.task_name}'.\n"
                f"Project: {context['project_name']}\n"
                f"Sprint: {context['sprint_name']}\n"
                f"View it here: {context['task_url']}\n\n"
                f"Best,Ei Scrum Team"
            )

            email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            logger.info(f"Email sent to {new_user.email} for task {instance.id}")
        except Exception as e:
            logger.error(f"Failed to send email to {new_user.email}: {str(e)}")
