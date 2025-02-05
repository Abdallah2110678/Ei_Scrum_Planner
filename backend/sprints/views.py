from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Sprint
from .serializers import SprintSerializer
import logging

# Set up logging
logger = logging.getLogger(__name__)

class SprintViewSet(viewsets.ModelViewSet):  
    """
    ViewSet for managing Sprints.
    - Create
    - Retrieve
    - Update
    - Delete
    - Mark sprint as completed
    """
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

    @action(detail=True, methods=['post'])
    def complete_sprint(self, request, pk=None):
        """
        Mark a Sprint as completed.
        """
        sprint = self.get_object()

        if sprint.is_completed:
            return Response({"message": "Sprint is already completed."}, status=status.HTTP_400_BAD_REQUEST)

        sprint.complete_sprint()
        return Response({"message": f"Sprint '{sprint.sprint_name}' marked as completed."}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """
        Create a Sprint. Ensures required fields are provided and logs any validation errors.
        """
        logger.info("📡 Received Sprint Creation Request: %s", request.data)

        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            logger.error("🚨 Sprint Validation Errors: %s", serializer.errors)  # 🔹 Log validation errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        logger.info("✅ Sprint Created Successfully: %s", serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
