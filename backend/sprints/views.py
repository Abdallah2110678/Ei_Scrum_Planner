from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import generics
from .models import Sprint
from .serializers import SprintSerializer


from rest_framework import viewsets

class SprintListCreateView(generics.ListCreateAPIView):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

class SprintRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

class SprintViewSet(viewsets.ModelViewSet):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

class SprintViewSet(viewsets.ModelViewSet):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

    @action(detail=True, methods=['post'])
    def complete_sprint(self, request, pk=None):
        sprint = self.get_object()
        
        if sprint.is_completed:
            return Response({"message": "Sprint is already completed."}, status=status.HTTP_400_BAD_REQUEST)
        
        sprint.complete_sprint()
        return Response({"message": "Sprint marked as completed."}, status=status.HTTP_200_OK)