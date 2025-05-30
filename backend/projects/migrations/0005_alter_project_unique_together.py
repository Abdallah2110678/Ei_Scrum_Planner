# Generated by Django 5.1.7 on 2025-04-21 17:16

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0004_project_enable_automation'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='project',
            unique_together={('name', 'created_by')},
        ),
    ]
