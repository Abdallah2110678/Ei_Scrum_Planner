# Generated by Django 5.1.7 on 2025-05-06 16:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('emotion_detection', '0003_dailyemotion_sprint'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dailyemotion',
            name='sprint',
        ),
    ]
