from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

    def validate(self, data):
        if not data.get("name"):
            raise serializers.ValidationError("Project name is required")
        return data
