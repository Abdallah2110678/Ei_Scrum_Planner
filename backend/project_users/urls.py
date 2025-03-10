from django.urls import path
from .views import ProjectUsersByProjectID, AddUserToProject

urlpatterns = [
    path('api/project/<int:project_id>/', ProjectUsersByProjectID.as_view(), name='project-users-api'),
    path('api/project/add-user/', AddUserToProject.as_view(), name='add-user-to-project'),
]
