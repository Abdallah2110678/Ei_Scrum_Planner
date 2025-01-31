from django.urls import path
from .views import SprintListCreateView, SprintRetrieveUpdateDeleteView

urlpatterns = [
    path('', SprintListCreateView.as_view(), name='sprint-list-create'),
    path('<int:pk>/', SprintRetrieveUpdateDeleteView.as_view(), name='sprint-detail'),
]
