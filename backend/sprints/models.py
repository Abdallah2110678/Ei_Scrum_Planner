from django.utils.timezone import now
from django.db import models
from datetime import timedelta

class Sprint(models.Model):
    DURATION_CHOICES = [
        (7, "1 week"),
        (14, "2 weeks"),
        (21, "3 weeks"),
        (28, "4 weeks"),
        (0, "Custom"),
    ]

    sprint_name = models.CharField(max_length=100)
    duration = models.IntegerField(choices=DURATION_CHOICES, default=14, blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    sprint_goal = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)  # ✅ New field

    def save(self, *args, **kwargs):
        # Only recalculate is_active if sprint is not completed
        if not self.is_completed:
            if self.start_date and self.duration > 0:
                self.end_date = self.start_date + timedelta(days=self.duration)

            if self.start_date and self.end_date:
                self.is_active = self.start_date <= now() <= self.end_date
            else:
                self.is_active = False

        super().save(*args, **kwargs)

    def complete_sprint(self):
        """Mark the sprint as completed."""
        self.is_completed = True
        self.end_date = now()
        self.is_active = False
        self.save()

    def __str__(self):
        return self.sprint_name
