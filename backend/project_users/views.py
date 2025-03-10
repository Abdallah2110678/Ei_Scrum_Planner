from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from users.models import User  # Import User model
from projects.models import Project  # Import Project model
from project_users.models import ProjectUsers
from project_users.serializers import ProjectUsersSerializer



from rest_framework.generics import ListAPIView
from project_users.models import ProjectUsers
from .serializers import ProjectUsersSerializer

class ProjectUsersByProjectID(ListAPIView):
    serializer_class = ProjectUsersSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return ProjectUsers.objects.filter(project_id=project_id).select_related('user')

class AddUserToProject(APIView):
    """
    Adds a user to a project by email.
    If the user does not exist, return an error.
    If the user is already in the project, return a message.
    """

    def post(self, request):
        email = request.data.get("email")  # Get user email from request
        project_id = request.data.get("project_id")  # Get project_id from request

        # Validate if project_id was provided
        if not project_id:
            return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user exists
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "This email does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Check if the project exists
        project = get_object_or_404(Project, id=project_id)

        # Check if the user is already in the project
        if ProjectUsers.objects.filter(user=user, project=project).exists():
            return Response({"message": "User is already in this project"}, status=status.HTTP_400_BAD_REQUEST)

        # Add the user to the project
        project_user = ProjectUsers.objects.create(user=user, project=project, points=0, badges="")

        # Return success response
        return Response(
            {"message": "User added to project successfully", "data": ProjectUsersSerializer(project_user).data},
            status=status.HTTP_201_CREATED
        )
