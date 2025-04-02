from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import Sprint
from .serializers import SprintSerializer
from projects.models import Project
from django.contrib.auth import get_user_model

User = get_user_model()

class SprintModelTests(TestCase):
    """Tests for the Sprint model"""
    
    def setUp(self):
        """Set up test data"""
        self.project = Project.objects.create(name="Test Project")
        self.current_time = timezone.now()
        
        # Create a sprint that is currently active
        self.active_sprint = Sprint.objects.create(
            sprint_name="Active Sprint",
            project=self.project,
            duration=14,
            start_date=self.current_time - timedelta(days=3),
            sprint_goal="Complete active sprint tests",
            is_active=True
        )
        
        # Create a sprint that hasn't started yet
        self.future_sprint = Sprint.objects.create(
            sprint_name="Future Sprint",
            project=self.project,
            duration=14,
            start_date=self.current_time + timedelta(days=7),
            sprint_goal="Complete future sprint tests",
            is_active=False
        )
        
        # Create a sprint that is completed
        self.completed_sprint = Sprint.objects.create(
            sprint_name="Completed Sprint",
            project=self.project,
            duration=14,
            start_date=self.current_time - timedelta(days=30),
            end_date=self.current_time - timedelta(days=16),
            sprint_goal="Complete completed sprint tests",
            is_active=False,
            is_completed=True
        )
    
    def test_sprint_creation(self):
        """Test creating a new sprint"""
        self.assertEqual(self.active_sprint.sprint_name, "Active Sprint")
        self.assertEqual(self.active_sprint.project, self.project)
        self.assertEqual(self.active_sprint.duration, 14)
        self.assertTrue(self.active_sprint.is_active)
        self.assertFalse(self.active_sprint.is_completed)
        
        # Check end date calculation
        expected_end_date = self.active_sprint.start_date + timedelta(days=14)
        self.assertEqual(self.active_sprint.end_date.date(), expected_end_date.date())
    
    def test_sprint_string_representation(self):
        """Test the string representation of a sprint"""
        self.assertEqual(str(self.active_sprint), f"Active Sprint (Project: {self.project.name})")
    
    @patch('django.utils.timezone.now')
    def test_auto_complete_sprint(self, mock_now):
        """Test that sprints are automatically completed when end date is reached"""
        # Set the current time to after the end date of the active sprint
        mock_now.return_value = self.active_sprint.end_date + timedelta(days=1)
        
        # Save the sprint to trigger the auto-complete logic
        self.active_sprint.save()
        
        # Refresh from database
        self.active_sprint.refresh_from_db()
        
        # Check that the sprint is now completed
        self.assertTrue(self.active_sprint.is_completed)
        self.assertFalse(self.active_sprint.is_active)
    
    def test_manual_complete_sprint(self):
        """Test manually completing a sprint"""
        # Complete the sprint
        self.active_sprint.complete_sprint()
        
        # Check that the sprint is now completed and not active
        self.assertTrue(self.active_sprint.is_completed)
        self.assertFalse(self.active_sprint.is_active)
        
        # Check that the end date is set to the current time
        self.assertIsNotNone(self.active_sprint.end_date)
        
        # The end date should be close to the current time
        time_difference = timezone.now() - self.active_sprint.end_date
        self.assertLess(time_difference.total_seconds(), 10)  # Less than 10 seconds difference


class SprintSerializerTests(TestCase):
    """Tests for the Sprint serializer"""
    
    def setUp(self):
        """Set up test data"""
        self.project = Project.objects.create(name="Test Project")
        self.sprint_data = {
            'sprint_name': 'New Sprint',
            'project': self.project.id,
            'duration': 14,
            'start_date': timezone.now().isoformat(),
            'sprint_goal': 'Test the serializer',
            'is_active': False,
            'is_completed': False
        }
    
    def test_sprint_serializer_valid_data(self):
        """Test serializing a sprint with valid data"""
        serializer = SprintSerializer(data=self.sprint_data)
        self.assertTrue(serializer.is_valid())
        sprint = serializer.save()
        self.assertEqual(sprint.sprint_name, 'New Sprint')
        self.assertEqual(sprint.project, self.project)
        self.assertEqual(sprint.duration, 14)
        self.assertEqual(sprint.sprint_goal, 'Test the serializer')
        # Sprint is active because start_date is now and it's not completed
        self.assertTrue(sprint.is_active)
        self.assertFalse(sprint.is_completed)
    
    def test_sprint_serializer_invalid_data(self):
        """Test serializing a sprint with invalid data"""
        # Missing required field (sprint_name)
        invalid_data = self.sprint_data.copy()
        invalid_data.pop('sprint_name')
        serializer = SprintSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sprint_name', serializer.errors)
        
        # Invalid project ID
        invalid_data = self.sprint_data.copy()
        invalid_data['project'] = 999  # Non-existent project ID
        serializer = SprintSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('project', serializer.errors)


class SprintAPITests(APITestCase):
    """Tests for the Sprint API endpoints"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password123",
            name="Test User",
            specialist="Developer"
        )
        self.client.force_authenticate(user=self.user)
        
        # Create a project
        self.project = Project.objects.create(name="Test Project")
        
        # Create some test sprints
        self.current_time = timezone.now()
        self.sprint1 = Sprint.objects.create(
            sprint_name="Sprint 1",
            project=self.project,
            duration=14,
            start_date=self.current_time - timedelta(days=3),
            sprint_goal="Complete sprint 1 tests",
            is_active=True
        )
        
        self.sprint2 = Sprint.objects.create(
            sprint_name="Sprint 2",
            project=self.project,
            duration=14,
            start_date=self.current_time + timedelta(days=14),
            sprint_goal="Complete sprint 2 tests",
            is_active=False
        )
        
        # URL for sprint list and detail
        self.list_url = reverse('sprint-list')
    
    def test_get_sprint_list(self):
        """Test retrieving a list of sprints"""
        response = self.client.get(self.list_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Check sprint names are in the response
        sprint_names = [sprint['sprint_name'] for sprint in response.data]
        self.assertIn('Sprint 1', sprint_names)
        self.assertIn('Sprint 2', sprint_names)
    
    def test_get_sprint_list_filtered_by_project(self):
        """Test retrieving a list of sprints filtered by project"""
        # Create another project with a sprint
        project2 = Project.objects.create(name="Another Project")
        Sprint.objects.create(
            sprint_name="Sprint in Another Project",
            project=project2,
            duration=14,
            start_date=self.current_time,
            sprint_goal="Test filtering",
            is_active=True
        )
        
        # Get sprints for the first project
        response = self.client.get(f"{self.list_url}?project={self.project.id}")
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Check that only sprints from the first project are returned
        sprint_names = [sprint['sprint_name'] for sprint in response.data]
        self.assertIn('Sprint 1', sprint_names)
        self.assertIn('Sprint 2', sprint_names)
        self.assertNotIn('Sprint in Another Project', sprint_names)
    
    def test_create_sprint(self):
        """Test creating a new sprint"""
        data = {
            'sprint_name': 'New Test Sprint',
            'project': self.project.id,
            'duration': 14,
            'start_date': (self.current_time + timedelta(days=28)).isoformat(),
            'sprint_goal': 'Test creating a sprint',
            'is_active': False,
            'is_completed': False
        }
        response = self.client.post(self.list_url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sprint_name'], 'New Test Sprint')
        
        # Check sprint was created in the database
        self.assertTrue(Sprint.objects.filter(sprint_name='New Test Sprint').exists())
    
    def test_get_sprint_detail(self):
        """Test retrieving a specific sprint"""
        detail_url = reverse('sprint-detail', args=[self.sprint1.id])
        response = self.client.get(detail_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sprint_name'], 'Sprint 1')
        self.assertEqual(response.data['sprint_goal'], 'Complete sprint 1 tests')
    
    def test_update_sprint(self):
        """Test updating a sprint"""
        detail_url = reverse('sprint-detail', args=[self.sprint1.id])
        data = {
            'sprint_name': 'Updated Sprint',
            'project': self.project.id,
            'duration': 21,  # Changed from 14 to 21
            'start_date': self.sprint1.start_date.isoformat(),
            'sprint_goal': 'Updated sprint goal',
            'is_active': True,
            'is_completed': False
        }
        response = self.client.put(detail_url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sprint_name'], 'Updated Sprint')
        self.assertEqual(response.data['duration'], 21)
        self.assertEqual(response.data['sprint_goal'], 'Updated sprint goal')
        
        # Check sprint was updated in the database
        self.sprint1.refresh_from_db()
        self.assertEqual(self.sprint1.sprint_name, 'Updated Sprint')
        self.assertEqual(self.sprint1.duration, 21)
        self.assertEqual(self.sprint1.sprint_goal, 'Updated sprint goal')
    
    def test_delete_sprint(self):
        """Test deleting a sprint"""
        detail_url = reverse('sprint-detail', args=[self.sprint1.id])
        response = self.client.delete(detail_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check sprint was deleted from the database
        self.assertFalse(Sprint.objects.filter(id=self.sprint1.id).exists())
    
    def test_complete_sprint_action(self):
        """Test the complete_sprint action"""
        # Create a sprint to complete
        sprint = Sprint.objects.create(
            sprint_name="Sprint to Complete",
            project=self.project,
            duration=14,
            start_date=timezone.now() - timedelta(days=7),
            sprint_goal="Test completing a sprint"
        )
        
        # URL for the complete_sprint action
        complete_url = reverse('sprint-complete-sprint', args=[sprint.id])
        
        # Call the action
        response = self.client.post(complete_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Check that the sprint was marked as completed
        sprint.refresh_from_db()
        self.assertTrue(sprint.is_completed)
        self.assertFalse(sprint.is_active)
