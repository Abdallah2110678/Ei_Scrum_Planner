# tasks/views.py
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from .models import Task
from .serializers import TaskSerializer
from sprints.models import Sprint

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Explicitly check and save user field to trigger signal
        if 'user' in serializer.validated_data and instance.user != serializer.validated_data['user']:
            instance.user = serializer.validated_data['user']
            instance.save(update_fields=['user'])  # Explicitly save user to ensure signal triggers
            return Response({
                "message": "Task updated successfully, email sent to assigned user",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        self.perform_update(serializer)
        return Response({
            "message": "Task updated successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_queryset(self):
        queryset = Task.objects.all()
        sprint_id = self.request.query_params.get("sprint")
        project_id = self.request.query_params.get("project_id")

        if project_id:
            print(f"Filtering by project_id: {project_id}")
            queryset = queryset.filter(project_id=project_id)

        if sprint_id == "null":
            queryset = queryset.filter(sprint__isnull=True)
        elif sprint_id:
            queryset = queryset.filter(sprint_id=sprint_id)

        print(f"Returning {queryset.count()} tasks")
        return queryset

    @action(detail=True, methods=['patch'])
    def assign_sprint(self, request, pk=None):
        task = self.get_object()
        sprint_id = request.data.get("sprint")
        if not sprint_id:
            return Response({"error": "Sprint ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            sprint = Sprint.objects.get(id=sprint_id)
            task.sprint = sprint
            task.save()
            return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)
        except Sprint.DoesNotExist:
            return Response({"error": "Sprint not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'])
    def remove_sprint(self, request, pk=None):
        task = self.get_object()
        task.sprint = None
        task.save()
        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        print("Received data:", request.data)
        return super().create(request, *args, **kwargs)