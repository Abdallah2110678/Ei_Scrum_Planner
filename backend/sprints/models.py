from django.utils.timezone import now
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
    is_active = models.BooleanField(default=False)  # ✅ New field to store sprint status

    def save(self, *args, **kwargs):
        # Auto-calculate end_date if duration is provided
        if self.start_date and self.duration > 0:  
            self.end_date = self.start_date + timedelta(days=self.duration)
        
        # Update is_active status based on current time
        if self.start_date and self.end_date:
            self.is_active = self.start_date <= now() <= self.end_date
        else:
            self.is_active = False

        super().save(*args, **kwargs)

    def __str__(self):
        return self.sprint_name
