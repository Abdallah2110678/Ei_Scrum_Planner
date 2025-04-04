from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
import uuid

from .models import ProjectUsers, Invitation
from projects.models import Project
from .serializers import ProjectUsersSerializer, InvitationSerializer, ProjectUserDetailSerializer

User = get_user_model()

class ProjectUsersModelTests(TestCase):
    """Tests for the ProjectUsers model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            name='Test User',
            specialist='Developer'
        )
        
        self.project = Project.objects.create(name='Test Project')
        
        self.project_user = ProjectUsers.objects.create(
            user=self.user,
            project=self.project,
            points=100
        )
    
    def test_project_user_creation(self):
        """Test creating a project user relationship"""
        self.assertEqual(self.project_user.user, self.user)
        self.assertEqual(self.project_user.project, self.project)
        self.assertEqual(self.project_user.points, 100)
        self.assertIsNone(self.project_user.badges)
    
    def test_string_representation(self):
        """Test the string representation of a project user"""
        expected_string = f"{self.user.name} - {self.project.name} (100 Points)"
        self.assertEqual(str(self.project_user), expected_string)
    
    def test_add_points(self):
        """Test adding points to a project user"""
        self.project_user.add_points(50)
        self.assertEqual(self.project_user.points, 150)
        
        # Verify the points were saved to the database
        refreshed_project_user = ProjectUsers.objects.get(id=self.project_user.id)
        self.assertEqual(refreshed_project_user.points, 150)
    
    def test_add_badge(self):
        """Test adding a badge to a project user"""
        # Add a badge
        self.project_user.add_badge('first_task')
        self.assertEqual(self.project_user.badges, 'first_task')
        
        # Add another badge
        self.project_user.add_badge('team_player')
        self.assertEqual(self.project_user.badges, 'first_task,team_player')
        
        # Try to add a duplicate badge
        self.project_user.add_badge('first_task')
        self.assertEqual(self.project_user.badges, 'first_task,team_player')
        
        # Verify the badges were saved to the database
        refreshed_project_user = ProjectUsers.objects.get(id=self.project_user.id)
        self.assertEqual(refreshed_project_user.badges, 'first_task,team_player')


class InvitationModelTests(TestCase):
    """Tests for the Invitation model"""
    
    def setUp(self):
        """Set up test data"""
        self.project = Project.objects.create(name='Test Project')
        
        self.invitation = Invitation.objects.create(
            email='invite@example.com',
            project=self.project
        )
    
    def test_invitation_creation(self):
        """Test creating an invitation"""
        self.assertEqual(self.invitation.email, 'invite@example.com')
        self.assertEqual(self.invitation.project, self.project)
        self.assertFalse(self.invitation.accepted)
        self.assertIsNotNone(self.invitation.token)
        self.assertIsNotNone(self.invitation.created_at)
    
    def test_string_representation(self):
        """Test the string representation of an invitation"""
        expected_string = f"Invitation for {self.invitation.email} to join {self.project.name}"
        self.assertEqual(str(self.invitation), expected_string)


class ProjectUsersSerializerTests(TestCase):
    """Tests for the ProjectUsers serializers"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            name='Test User',
            specialist='Developer'
        )
        
        self.project = Project.objects.create(name='Test Project')
        
        self.project_user = ProjectUsers.objects.create(
            user=self.user,
            project=self.project,
            points=100,
            badges='first_task,team_player'
        )
        
        self.serializer_data = {
            'user': self.user.id,
            'project': self.project.id,
            'points': 200,
            'badges': 'master_coder'
        }
    
    def test_project_users_serializer(self):
        """Test serializing a project user"""
        serializer = ProjectUsersSerializer(self.project_user)
        
        self.assertIn('project', serializer.data)
        self.assertIn('points', serializer.data)
        self.assertIn('badges', serializer.data)
        self.assertIn('user', serializer.data)
        
        self.assertEqual(serializer.data['points'], 100)
        self.assertEqual(serializer.data['badges'], 'first_task,team_player')
    
    def test_project_user_detail_serializer(self):
        """Test the ProjectUserDetailSerializer"""
        # Create a serializer with the user instance
        serializer = ProjectUserDetailSerializer(instance=self.user)
        
        # Check that the serializer includes all expected fields
        self.assertIn('id', serializer.data)
        self.assertIn('name', serializer.data)
        self.assertIn('email', serializer.data)
        self.assertIn('specialist', serializer.data)
        self.assertIn('role', serializer.data)
        
        # Check that the role is set to the default "Developer"
        self.assertEqual(serializer.data['role'], "Developer")


class ProjectUsersAPITests(APITestCase):
    """Tests for the ProjectUsers API endpoints"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        
        # Create users
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            name='Test User',
            specialist='Developer'
        )
        
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            name='Admin User',
            specialist='Admin'
        )
        
        # Create a project
        self.project = Project.objects.create(name='Test Project')
        
        # Add users to project
        self.project_user = ProjectUsers.objects.create(
            user=self.user,
            project=self.project,
            points=100
        )
        
        # Authenticate the admin user
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # URLs for project users endpoints
        self.list_url = reverse('project-users-api', args=[self.project.id])
        self.add_user_url = reverse('add-user-to-project')
        self.accept_invitation_url = lambda token: reverse('accept-invitation', args=[token])
    
    def test_get_project_users_list(self):
        """Test retrieving a list of users for a project"""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['user']['name'], 'Test User')
    
    @patch('project_users.views.send_mail')
    def test_add_user_to_project(self, mock_send_mail):
        """Test adding a user to a project via invitation"""
        data = {
            'email': 'newuser@example.com',
            'project_id': self.project.id
        }
        
        response = self.client.post(self.add_user_url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that an invitation was created
        self.assertTrue(Invitation.objects.filter(email='newuser@example.com').exists())
        
        # Check that an email was sent
        mock_send_mail.assert_called_once()
    
    @patch('project_users.views.send_mail')
    def test_add_existing_user_to_project(self, mock_send_mail):
        """Test adding a user who already exists to a project"""
        # Create a new user
        new_user = User.objects.create_user(
            email='existing@example.com',
            password='password123',
            name='Existing User',
            specialist='Developer'
        )
        
        data = {
            'email': 'existing@example.com',
            'project_id': self.project.id
        }
        
        response = self.client.post(self.add_user_url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that an invitation was created
        self.assertTrue(Invitation.objects.filter(email='existing@example.com').exists())
        
        # Check that an email was sent
        mock_send_mail.assert_called_once()
    
    def test_accept_invitation(self):
        """Test accepting an invitation"""
        # Create a user who will accept the invitation
        accepting_user = User.objects.create_user(
            email='accepting@example.com',
            password='password123',
            name='Accepting User',
            specialist='Developer'
        )
        
        # Authenticate the accepting user
        refresh = RefreshToken.for_user(accepting_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create an invitation for this user
        invitation = Invitation.objects.create(
            email='accepting@example.com',
            project=self.project
        )
        
        # URL for accepting the invitation
        accept_url = self.accept_invitation_url(invitation.token)
        
        response = self.client.post(accept_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that the invitation was marked as accepted
        invitation.refresh_from_db()
        self.assertTrue(invitation.accepted)
        
        # Check that the user was added to the project
        self.assertTrue(ProjectUsers.objects.filter(user=accepting_user, project=self.project).exists())
