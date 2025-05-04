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
    
    estimated_effort = models.FloatField(null=True, blank=True)
    actual_effort = models.FloatField(null=True, blank=True)
    rework_effort = models.FloatField(null=True, blank=True, default=0.0)

    rework_count = models.PositiveIntegerField(default=0)

    task_name = models.CharField(max_length=255)
    task_category = models.CharField(max_length=50, default="Frontend")
    task_complexity = models.CharField(max_length=10, choices=COMPLEXITY_CHOICES, default="MEDIUM") 
    priority = models.IntegerField(default=1)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="TO DO")
    is_reactivated = models.BooleanField(default=False)

    @property
    def productivity_score(self):
        """Calculates the productivity score (Actual Effort / Estimated Effort)"""
        if self.actual_effort and self.estimated_effort:
            return self.actual_effort / self.estimated_effort
        return None

    def __str__(self):
        return self.task_name
    
def handle_task_reactivation(instance, old_status):
    """
    Marks task as reactivated if it moves from DONE to TO DO and sends a rework email.
    """
    if old_status == "DONE" and instance.status == "TO DO":
        instance.rework_count += 1
        instance.is_reactivated = True
        instance.save(update_fields=["rework_count", "is_reactivated"])

        logger.info(f"Task {instance.id} marked as reactivated. Rework count: {instance.rework_count}")

        # Send rework email
        if instance.user and instance.user.email:
            subject = f"Task Reactivated for Rework"
            from_email = f"Ei Scrum Team <{settings.DEFAULT_FROM_EMAIL}>"
            to_email = [instance.user.email]

            context = {
                'user_name': getattr(instance.user, 'name', instance.user.email),
                'task_name': instance.task_name,
                'project_name': instance.project.name if instance.project else "No Project",
                'sprint_name': instance.sprint.sprint_name if instance.sprint else "No Sprint",
                'task_url': f"{settings.FRONTEND_URL}/tasks/{instance.id}",
                'rework_count': instance.rework_count,
            }

            try:
                html_content = render_to_string('email/task_rework.html', context)
                text_content = (
                    f"Hi {context['user_name']},\n\n"
                    f"The task '{context['task_name']}' has been reactivated and marked for rework.\n"
                    f"Project: {context['project_name']}\n"
                    f"Sprint: {context['sprint_name']}\n"
                    f"Rework Count: {context['rework_count']}\n"
                    f"View it here: {context['task_url']}\n\n"
                    f"Please check the required fixes.\n\n"
                    f"Best,\nEi Scrum Team"
                )

                email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
                email.attach_alternative(html_content, "text/html")
                email.send(fail_silently=False)
                logger.info(f"✅ Rework email sent to {instance.user.email} for task {instance.id}")
            except Exception as e:
                logger.error(f"❌ Failed to send rework email to {instance.user.email}: {str(e)}")


@receiver(pre_save, sender=Task)
def cache_old_user(sender, instance, **kwargs):
    if instance.id:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            _local.old_user = old_instance.user
            _local.old_status = old_instance.status
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
        subject = "Task Assigned"
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

    # ✅ This part was missing!
    old_status = getattr(_local, 'old_status', None)
    handle_task_reactivation(instance, old_status)
