from django.db import models
from datetime import timedelta

class Sprint(models.Model):
    DURATION_CHOICES = [
        (7, "1 week"),
        (14, "2 weeks"),
        (21, "3 weeks"),
        (28, "4 weeks"),
        (0, "Custom"),  # Custom option for manual end date
    ]

    sprint_name = models.CharField(max_length=100)
    duration = models.IntegerField(choices=DURATION_CHOICES, default=14, blank=True, null=True)  # ✅ Optional Duration
    start_date = models.DateTimeField(blank=True, null=True)  # ✅ Optional Start Date
    end_date = models.DateTimeField(blank=True, null=True)  # ✅ Optional End Date
    sprint_goal = models.TextField(blank=True, null=True)  # ✅ Optional Sprint Goal

    def save(self, *args, **kwargs):
        
        if self.start_date and self.duration > 0:  # Only calculate if duration is not custom
            self.end_date = self.start_date + timedelta(days=self.duration)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.sprint_name