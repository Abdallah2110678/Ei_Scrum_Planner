from rest_framework import viewsets
from .models import Task
from .serializers import TaskSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from sprints.models import Sprint
from .ml import train_model, predict_effort
from rest_framework.decorators import api_view




@api_view(["GET"])
def train_effort_model(request):
    try:
        algo, mae = train_model()
        return Response({"message": "Model trained", "algorithm": algo, "mae": mae})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["POST"])
def predict_effort_view(request):
    try:
        data = request.data
        task_id = data.get("task_id")
        task_category = data.get("task_category")
        task_complexity = data.get("task_complexity")

        predicted = predict_effort(task_complexity, task_category)
        
        task = Task.objects.get(id=task_id)
        task.estimated_effort = predicted
        task.save()

        return Response({
            "predicted_effort": round(predicted, 2),
            "task_name": task.task_name,
            "task_category": task.task_category,
            "task_complexity": task.task_complexity,
        })
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
class TaskViewSet(viewsets.ModelViewSet):
    """
    API View for Tasks
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def list(self, request, *args, **kwargs):
        """
        Fetch all tasks, with optional filtering by project_id and sprint.
        """
        queryset = self.get_queryset()  # This will use the filtered queryset
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def get_queryset(self):
        """
        Fetch tasks optionally filtered by sprint or project.
        """
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
        """Assign a Task to a Sprint"""
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
        """Remove a Task from its Sprint (Set Sprint to NULL)"""
        task = self.get_object()
        task.sprint = None
        task.save()
        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        print("Received data:", request.data)  # Keep this logging
        return super().create(request, *args, **kwargs)