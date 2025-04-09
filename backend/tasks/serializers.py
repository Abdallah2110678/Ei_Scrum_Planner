from rest_framework import serializers
from .models import Task
from django.contrib.auth import get_user_model  # Use custom User model

User = get_user_model()  # Get the correct User model dynamically

class TaskSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False
    )
    productivity_score = serializers.ReadOnlyField()
    estimated_effort = serializers.FloatField(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
