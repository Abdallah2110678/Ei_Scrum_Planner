from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateProject, GetProjectsByUser, ProjectViewSet

# router = DefaultRouter()
# router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('create/', CreateProject.as_view(), name='create-project'),  # ✅ FIX: Do NOT include 'projects.urls' here
    path('user/<int:user_id>/', GetProjectsByUser.as_view(), name='get-projects-by-user'),
]