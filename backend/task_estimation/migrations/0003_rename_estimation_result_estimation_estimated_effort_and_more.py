# Generated by Django 5.1.7 on 2025-04-03 12:59

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('task_estimation', '0002_estimation_delete_task'),
    ]

    operations = [
        migrations.RenameField(
            model_name='estimation',
            old_name='estimation_result',
            new_name='estimated_effort',
        ),
        migrations.AddField(
            model_name='estimation',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='estimation',
            name='productivity',
            field=models.FloatField(default=1.0),
        ),
    ]
