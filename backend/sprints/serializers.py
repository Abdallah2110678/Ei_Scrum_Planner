from rest_framework import serializers
from .models import Sprint
from tasks.serializers import TaskSerializer
from projects.models import Project  # Import Project model

class SprintSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    custom_end_date = serializers.DateTimeField(required=False)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), required=True)  # ✅ Ensure Project is required

    class Meta:
        model = Sprint
        fields = ['id', 'sprint_name', 'project', 'duration', 'start_date', 'sprint_goal', 'custom_end_date', 'tasks', 'is_active', 'is_completed']

    def validate(self, attrs):
        """Ensure valid Sprint creation rules."""
        if attrs.get('duration') == 0 and not attrs.get('custom_end_date'):
            raise serializers.ValidationError("Custom end date must be provided if 'Custom' duration is selected.")

        if attrs.get('duration') == 0:
            attrs['end_date'] = attrs['custom_end_date']

        return attrs

    def create(self, validated_data):
        """Create a Sprint only if it has a valid Project ID."""
        custom_end_date = validated_data.pop('custom_end_date', None)
        sprint = Sprint(**validated_data)

        if custom_end_date:
            sprint.end_date = custom_end_date

        sprint.save()
        return sprint
