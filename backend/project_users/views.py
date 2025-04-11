from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from users.models import User  # Import User model
from projects.models import Project  # Import Project model
from project_users.models import Invitation, ProjectUsers
from project_users.serializers import ProjectUsersSerializer, InvitationSerializer

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework.generics import ListAPIView

class ProjectUsersByProjectID(ListAPIView):
    serializer_class = ProjectUsersSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return ProjectUsers.objects.filter(project_id=project_id).select_related('user')

class AddUserToProject(APIView):
    """
    Adds a single user to a project by email via an invitation.
    Ensures no redundant invitations or project memberships.
    Sends a professional HTML email to avoid spam filters.
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

        # # Check if an unaccepted invitation already exists
        # if Invitation.objects.filter(email=email, project=project, accepted=False).exists():
        #     return Response({"message": "Invitation already sent to this email"}, status=status.HTTP_400_BAD_REQUEST)

        # Create and store invitation in the database
        invitation = Invitation.objects.create(email=email, project=project)
        
        # Generate invitation URL
        invitation_url = f"{settings.FRONTEND_URL}/eiscrum/accept-invitation/{invitation.token}"
        
        # Prepare email content
        subject = f"Invitation to Join {project.name}"
        from_email = f"Your Team <{settings.DEFAULT_FROM_EMAIL}>"  # Friendly "From" name
        to_email = [email]

        # Render HTML and plain text versions
        context = {
            'user_email': email,  # Use email if user name isn’t available
            'project_name': project.name,
            'invitation_url': invitation_url,
        }
        html_content = render_to_string('email/invitation.html', context)
        text_content = (
            f"Hi,\n\n"
            f"You’ve been invited to join the project '{project.name}'.\n"
            f"Click here to accept: {invitation_url}\n\n"
            f"Thanks,\nYour Team"
        )

        # Send email with both HTML and plain text
        try:
            email_message = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=to_email,
            )
            email_message.attach_alternative(html_content, "text/html")
            email_message.send(fail_silently=False)
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

# Rest of your code remains unchanged
def get_project_team_list(project_id):
    try:
        project = Project.objects.get(id=project_id)
        result = {"project_name": project.name, "users": []}
        creator = project.created_by
        if creator:
            try:
                creator_in_project_users = ProjectUsers.objects.get(project=project, user=creator)
                points = creator_in_project_users.points
                badges = creator_in_project_users.get_badges_list()
            except ProjectUsers.DoesNotExist:
                points = None
                badges = []
            result["users"].append({
                "id": creator.id,
                "name": creator.name,
                "specialist": creator.specialist,
                "email": creator.email,
                "role": "Scrum Master",
                "points": points,
                "badges": badges
            })
        project_users = ProjectUsers.objects.filter(project=project).select_related('user')
        for pu in project_users:
            if creator and pu.user.id == creator.id:
                continue
            result["users"].append({
                "id": pu.user.id,
                "name": pu.user.name,
                "specialist": pu.user.specialist,
                "email": pu.user.email,
                "role": "Developer",
                "points": pu.points,
                "badges": pu.get_badges_list()
            })
        return result
    except Project.DoesNotExist:
        return {"error": "Project not found"}

class ProjectTeamListView(APIView):
    def get(self, request, project_id):
        data = get_project_team_list(project_id)
        if "error" in data:
            return JsonResponse({"error": data["error"]}, status=404)
        return JsonResponse(data, status=200)