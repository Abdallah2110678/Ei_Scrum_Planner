from rest_framework import serializers
from project_users.models import Invitation, ProjectUsers
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

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['id', 'email', 'project', 'token', 'created_at', 'accepted']
