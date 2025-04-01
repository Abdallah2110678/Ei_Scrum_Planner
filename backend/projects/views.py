from rest_framework import viewsets
from .models import Project
from .serializers import ProjectSerializer



# projects/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Project
from users.models import User
from .serializers import ProjectSerializer

class CreateProject(APIView):
    """
    Creates a project with a specified creator (user ID) provided in the request.
    Does not require authentication.
    """
    def post(self, request):
        name = request.data.get("name")
        user_id = request.data.get("user_id")  # Use user_id instead of email

        # Validate inputs
        if not name:
            return Response({"error": "Project name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id or not isinstance(user_id, int):
            return Response({"error": "A valid user ID (integer) is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if project name is unique
        if Project.objects.filter(name=name).exists():
            return Response({"error": "A project with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Find the user by ID
        user = get_object_or_404(User, id=user_id)  # Raises 404 if user doesn’t exist

        # Create the project
        project = Project.objects.create(
            name=name,
            created_by=user
        )

        # Return success response
        return Response(
            {
                "message": "Project created successfully",
                "data": ProjectSerializer(project).data
            },
            status=status.HTTP_201_CREATED
        )
    

class GetProjectsByUser(APIView):
    """
    Fetches all project names and IDs where the user is either the creator (Project.created_by)
    or a participant (ProjectUsers.user), matching the given user ID.
    """
    def get(self, request, user_id):
        # Validate user_id
        if not isinstance(user_id, int):
            return Response({"error": "Invalid user ID"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        user = get_object_or_404(User, id=user_id)

        # Fetch projects where user is the creator
        created_projects = Project.objects.filter(created_by=user)

        # Fetch projects where user is a participant
        participated_projects = Project.objects.filter(project_users__user=user)

        # Combine and remove duplicates
        all_projects = created_projects | participated_projects
        all_projects = all_projects.distinct()

        # Serialize to get only id and name
        serializer = ProjectSerializer(all_projects, many=True)

        # Return response
        return Response(
            {
                "message": "Projects retrieved successfully",
                "user_id": user_id,
                "projects": serializer.data
            },
            status=status.HTTP_200_OK
        )
class ProjectViewSet(viewsets.ModelViewSet):
    """
    API View for Projects
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
