from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateProject, GetProjectsByUser, ProjectViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='projects')  # empty path here means base is `/api/projects/`

urlpatterns = [
    path('create/', CreateProject.as_view(), name='create-project'),
    path('user/<int:user_id>/', GetProjectsByUser.as_view(), name='get-projects-by-user'),
    path('', include(router.urls)),  # ✅ Include router URLs
]
