# Generated by Django 5.1.7 on 2025-04-03 12:59

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_experience'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='experience',
        ),
    ]
