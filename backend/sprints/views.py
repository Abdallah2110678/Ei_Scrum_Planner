from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Sprint
from .serializers import SprintSerializer
from django.utils import timezone
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
    - Auto-complete expired sprints
    """
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
    
    def get_queryset(self):
        # First check for and auto-complete any expired sprints
        self.check_expired_sprints()
        
        # Then return filtered sprints
        project_id = self.request.query_params.get('project')
        if project_id:
            return Sprint.objects.filter(project_id=project_id)
        return Sprint.objects.all()
    
    def check_expired_sprints(self):
        """
        Check for and auto-complete any expired sprints
        """
        current_time = timezone.now()
        
        # Find active sprints that have passed their end date
        expired_sprints = Sprint.objects.filter(
            is_active=True,
            is_completed=False,
            end_date__lt=current_time
        )
        
        count = 0
        for sprint in expired_sprints:
            logger.info(f"Auto-completing expired sprint: {sprint.sprint_name} (ID: {sprint.id})")
            
            # Move incomplete tasks back to backlog
            for task in sprint.tasks.exclude(status="DONE"):
                task.sprint = None
                task.status = "TO DO"
                task.save()
            
            # Complete the sprint
            sprint.is_completed = True
            sprint.is_active = False
            sprint.save()
            count += 1
        
        if count > 0:
            logger.info(f"Auto-completed {count} expired sprints")

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

    @action(detail=False, methods=['get'])
    def check_all_expired(self, request):
        """
        Endpoint to manually trigger checking for expired sprints
        """
        self.check_expired_sprints()
        return Response({"message": "Checked and processed any expired sprints"}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """
        Create a Sprint. Ensures required fields are provided and logs any validation errors.
        """
        logger.info("📡 Received Sprint Creation Request: %s", request.data)

        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            logger.error("🚨 Sprint Validation Errors: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        logger.info("✅ Sprint Created Successfully: %s", serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
