from rest_framework import serializers
from project_users.models import ProjectUsers
from users.models import User  # Import your User model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'email', 'specialist', 'experience']  # Exclude user ID

class ProjectUsersSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Nested user data instead of ID

    class Meta:
        model = ProjectUsers
        fields = ['project', 'points', 'badges', 'user']
