from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateProject, GetProjectsByUser, ProjectViewSet, TaskAssignmentViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='projects')  # this maps to /api/projects/
router.register(r'task-assignments', TaskAssignmentViewSet, basename='task-assignment')  # this maps to /api/projects/task-assignments/

urlpatterns = [
    path('create/', CreateProject.as_view(), name='create-project'),
    path('user/<int:user_id>/', GetProjectsByUser.as_view(), name='get-projects-by-user'),
    path('', include(router.urls)),  # include the router
]
