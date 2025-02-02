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
