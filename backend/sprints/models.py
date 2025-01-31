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
    duration = models.IntegerField(choices=DURATION_CHOICES, default=14)  # Default: 2 weeks
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(blank=True, null=True)
    sprint_goal = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        
        if self.start_date and self.duration > 0:  # Only calculate if duration is not custom
            self.end_date = self.start_date + timedelta(days=self.duration)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.sprint_name