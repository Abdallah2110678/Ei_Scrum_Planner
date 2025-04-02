from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from users.models import User  # Import User model
from projects.models import Project  # Import Project model
from project_users.models import Invitation, ProjectUsers
from project_users.serializers import ProjectUsersSerializer


from django.core.mail import send_mail
from rest_framework.generics import ListAPIView
from project_users.models import ProjectUsers
from .serializers import InvitationSerializer, ProjectUserDetailSerializer, ProjectUsersSerializer

class ProjectUsersByProjectID(ListAPIView):
    serializer_class = ProjectUsersSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return ProjectUsers.objects.filter(project_id=project_id).select_related('user')

class AddUserToProject(APIView):
    """
    Adds a single user to a project by email via an invitation.
    Ensures no redundant invitations or project memberships.
    """
    def post(self, request):
        email = request.data.get("email")  # Single email per request
        project_id = request.data.get("project_id")

        # Validate inputs
        if not project_id:
            return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not email or not isinstance(email, str):
            return Response({"error": "A valid email is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if project exists
        project = get_object_or_404(Project, id=project_id)

        # Check if user is already in the project
        user = User.objects.filter(email=email).first()
        if user and ProjectUsers.objects.filter(user=user, project=project).exists():
            return Response({"message": "User is already in this project"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if an unaccepted invitation already exists
        if Invitation.objects.filter(email=email, project=project, accepted=False).exists():
            return Response({"message": "Invitation already sent to this email"}, status=status.HTTP_400_BAD_REQUEST)

        # Create and store invitation in the database
        invitation = Invitation.objects.create(email=email, project=project)
        
        # Generate invitation URL
        invitation_url = f"{settings.FRONTEND_URL}/accept-invitation/{invitation.token}"
        
        # Send email
        try:
            send_mail(
                subject=f"Invitation to join {project.name}",
                message=f"You have been invited to join {project.name}. Click here to accept: {invitation_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            # If email sending fails, delete the invitation and return an error
            invitation.delete()
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return success response with invitation data
        return Response(
            {
                "message": "Invitation sent successfully",
                "data": InvitationSerializer(invitation).data
            },
            status=status.HTTP_201_CREATED
        )
class AcceptInvitation(APIView):
    def post(self, request, token):
        invitation = get_object_or_404(Invitation, token=token, accepted=False)
        
        # Check if user exists
        user = User.objects.filter(email=invitation.email).first()
        if not user:
            return Response({"error": "No user found with this email. Please register first."}, 
                          status=status.HTTP_404_NOT_FOUND)

        # Check if user is already in project
        if ProjectUsers.objects.filter(user=user, project=invitation.project).exists():
            invitation.accepted = True
            invitation.save()
            return Response({"message": "User is already in this project"}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Add user to project
        project_user = ProjectUsers.objects.create(
            user=user,
            project=invitation.project,
            points=0,
            badges=""
        )
        
        # Mark invitation as accepted
        invitation.accepted = True
        invitation.save()

        return Response(
            {"message": "Project joined successfully", "data": ProjectUsersSerializer(project_user).data},
            status=status.HTTP_201_CREATED
        )
    

def get_project_team_list(project_id):
    try:
        # Get the project by ID
        project = Project.objects.get(id=project_id)
        
        # Initialize the result dictionary with a list of users
        result = {
            "project_name": project.name,
            "users": []
        }
        
        # Get the creator (Scrum Master)
        creator = project.created_by
        creator_in_project_users = None
        if creator:
            # Check if the creator is also in ProjectUsers to get their points and badges
            try:
                creator_in_project_users = ProjectUsers.objects.get(project=project, user=creator)
                points = creator_in_project_users.points
                badges = creator_in_project_users.get_badges_list()
            except ProjectUsers.DoesNotExist:
                points = None
                badges = []
            
            # Add the Scrum Master to the list
            result["users"].append({
                "id": creator.id,
                "name": creator.name,
                "specialist": creator.specialist,
                "email": creator.email,
                "experience": creator.experience,
                "role": "Scrum Master",
                "points": points,
                "badges": badges
            })
        
        # Get all users involved in the project via ProjectUsers (Developers)
        project_users = ProjectUsers.objects.filter(project=project).select_related('user')
        for pu in project_users:
            # Skip the creator if already added as Scrum Master
            if creator and pu.user.id == creator.id:
                continue
            
            # Add the developer to the list
            result["users"].append({
                "id": pu.user.id,
                "name": pu.user.name,
                "specialist": pu.user.specialist,
                "email": pu.user.email,
                "experience": pu.user.experience,
                "role": "Developer",
                "points": pu.points,
                "badges": pu.get_badges_list()
            })
        
        return result
    
    except Project.DoesNotExist:
        return {"error": "Project not found"}

# Django View for React endpoint
class ProjectTeamListView(APIView):
    def get(self, request, project_id):
        data = get_project_team_list(project_id)
        if "error" in data:
            return JsonResponse({"error": data["error"]}, status=404)
        return JsonResponse(data, status=200)