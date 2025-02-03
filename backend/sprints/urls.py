from django.urls import path
from .views import SprintListCreateView, SprintRetrieveUpdateDeleteView, SprintViewSet
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SprintViewSet
router = DefaultRouter()
router.register(r'sprints', SprintViewSet, basename='sprint')


urlpatterns = [
    path('', SprintListCreateView.as_view(), name='sprint-list-create'),
    path('<int:pk>/', SprintRetrieveUpdateDeleteView.as_view(), name='sprint-detail'),
    path('<int:pk>/complete_sprint/', SprintViewSet.as_view({'post': 'complete_sprint'}), name='sprint-complete-sprint'),
    path('', include(router.urls)),

    # Create Sprint	POST	/api/v1/sprints/sprints/
    # Get All Sprints	GET	/api/v1/sprints/sprints/
    # Update Sprint	PUT	/api/v1/sprints/sprints/1/
    # Delete Sprint	DELETE	/api/v1/sprints/sprints/1/
]
