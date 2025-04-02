from django.urls import path
from .views import ProjectUsersByProjectID, AddUserToProject ,AcceptInvitation, ProjectTeamListView

urlpatterns = [
    path('api/project/<int:project_id>/', ProjectUsersByProjectID.as_view(), name='project-users-api'),
    path('add-user-to-project/', AddUserToProject.as_view(), name='add-user-to-project'),
    path('accept-invitation/<uuid:token>/', AcceptInvitation.as_view(), name='accept-invitation'),
    path('projects/<int:project_id>/users/', ProjectTeamListView.as_view(), name='ProjectTeamListView'),
]
