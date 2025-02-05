# Generated by Django 5.1.3 on 2025-02-05 00:15

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
        ('sprints', '0005_sprint_is_completed'),
    ]

    operations = [
        migrations.AddField(
            model_name='sprint',
            name='project',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sprints', to='projects.project'),
        ),
    ]
