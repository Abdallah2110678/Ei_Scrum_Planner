from rest_framework import serializers
from .models import DeveloperPerformance

class DeveloperPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeveloperPerformance
        fields = '__all__'
