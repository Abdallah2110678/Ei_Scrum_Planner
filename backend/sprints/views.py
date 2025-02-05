from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Sprint
from .serializers import SprintSerializer

class SprintViewSet(viewsets.ModelViewSet):  # ✅ Must be ModelViewSet
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

    @action(detail=True, methods=['post'])
    def complete_sprint(self, request, pk=None):
        """Mark a Sprint as completed."""
        sprint = self.get_object()

        if sprint.is_completed:
            return Response({"message": "Sprint is already completed."}, status=status.HTTP_400_BAD_REQUEST)

        sprint.complete_sprint()
        return Response({"message": f"Sprint '{sprint.sprint_name}' marked as completed."}, status=status.HTTP_200_OK)