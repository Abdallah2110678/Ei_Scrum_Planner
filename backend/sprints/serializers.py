from rest_framework import serializers
from tasks.serializers import TaskSerializer
from .models import Sprint

class SprintSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)  # ✅ Include related tasks
    custom_end_date = serializers.DateTimeField(required=False)  # Optional field

    class Meta:
        model = Sprint
        fields = ['id', 'sprint_name', 'duration', 'start_date', 'sprint_goal', 'custom_end_date', 'tasks']

    def validate(self, attrs):
        # Custom validation for end date if duration is "Custom"
        if attrs.get('duration') == 0 and not attrs.get('custom_end_date'):
            raise serializers.ValidationError("Custom end date must be provided if 'Custom' duration is selected.")

        # Set end_date if custom_end_date is provided
        if attrs.get('duration') == 0:
            attrs['end_date'] = attrs['custom_end_date']
        return attrs

    def create(self, validated_data):
        custom_end_date = validated_data.pop('custom_end_date', None)
        sprint = Sprint(**validated_data)

        # If custom_end_date is provided, set it
        if custom_end_date:
            sprint.end_date = custom_end_date

        sprint.save()
        return sprint