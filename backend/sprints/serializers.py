from rest_framework import serializers
from .models import Sprint

class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ['id', 'sprint_name', 'duration', 'start_date', 'sprint_goal']
