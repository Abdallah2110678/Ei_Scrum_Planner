from rest_framework import generics
from .models import Sprint
from .serializers import SprintSerializer

class SprintListCreateView(generics.ListCreateAPIView):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

class SprintRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
