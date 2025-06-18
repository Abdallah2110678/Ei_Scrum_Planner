from django.test import TestCase, RequestFactory
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import Project
from .serializers import ProjectSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class ProjectModelTests(TestCase):
    """Tests for the Project model"""
    
    def test_project_creation(self):
        """Test creating a new project"""
        project = Project.objects.create(name="Test Project")
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(str(project), "Test Project")
    
    def test_project_unique_name(self):
        """Test that project names must be unique per user"""
        # Create a test user
        user = User.objects.create_user(
            email="test@example.com",
            password="password123",
            name="Test User",
            specialist="Developer"
        )
        
        # Create a project with a user
        Project.objects.create(name="Unique Project", created_by=user)
        
        # Attempting to create another project with the same name and same user should raise an error
        with self.assertRaises(Exception):
            Project.objects.create(name="Unique Project", created_by=user)


class ProjectSerializerTests(TestCase):
    """Tests for the Project serializer"""
    
    def setUp(self):
        self.project_data = {
            'name': 'Test Project'
        }
        
        self.project = Project.objects.create(name="Existing Project")
    
    def test_project_serializer(self):
        """Test serializing a project"""
        serializer = ProjectSerializer(self.project)
        
        # Check that serialized data contains expected fields
        self.assertIn('id', serializer.data)
        self.assertIn('name', serializer.data)
        
        # Check field values
        self.assertEqual(serializer.data['name'], 'Existing Project')
    
    def test_project_serializer_create(self):
        """Test creating a project with the serializer"""
        # Create a test user for the project
        user = User.objects.create_user(
            email="serializer_test@example.com",
            password="password123",
            name="Serializer Test User",
            specialist="Developer"
        )
        
        # Include the user in the project data
        project_data = {
            'name': 'Test Project',
            'created_by': user.id
        }
        
        serializer = ProjectSerializer(data=project_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        project = serializer.save()
        
        # Check that the project was created with the correct data
        self.assertEqual(project.name, 'Test Project')
        self.assertEqual(project.created_by, user)


class ProjectAPITests(APITestCase):
    """Tests for the Project API endpoints"""
    
    def setUp(self):
        """Set up test data and client"""
        # Create a test user
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password123",
            name="Test User",
            specialist="Developer"
        )
        self.client.force_authenticate(user=self.user)
        
        # Create some test projects
        self.project1 = Project.objects.create(name="Project 1")
        self.project2 = Project.objects.create(name="Project 2")
        
        # URLs for project endpoints
        self.create_url = reverse('create-project')
        self.user_projects_url = reverse('get-projects-by-user', args=[self.user.id])
    
    def test_get_project_list(self):
        """Test retrieving a list of projects"""
        # Associate projects with the user
        self.project1.created_by = self.user
        self.project1.save()
        self.project2.created_by = self.user
        self.project2.save()
        
        response = self.client.get(self.user_projects_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('projects', response.data)
        
        # Check that our projects are in the response
        project_names = [project['name'] for project in response.data['projects']]
        self.assertIn('Project 1', project_names)
        self.assertIn('Project 2', project_names)
    
    def test_get_project_detail(self):
        """Test retrieving a specific project"""
        # Associate project with the user
        self.project1.created_by = self.user
        self.project1.save()
        
        # Get projects by user and check if our project is in the response
        response = self.client.get(self.user_projects_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('projects', response.data)
        
        # Find our project in the response
        project_ids = [project['id'] for project in response.data['projects']]
        self.assertIn(self.project1.id, project_ids)
        
        # Find our project data
        project_data = next(p for p in response.data['projects'] if p['id'] == self.project1.id)
        self.assertEqual(project_data['name'], 'Project 1')
    
    def test_create_project(self):
        """Test creating a new project"""
        import uuid
        unique_name = f"Test Project {uuid.uuid4().hex[:8]}"
        
        data = {
            'name': unique_name,
            'user_id': self.user.id
        }
        response = self.client.post(self.create_url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['name'], unique_name)
        
        # Check project was created in database
        self.assertTrue(Project.objects.filter(name=unique_name).exists())
    
    def test_create_project_invalid_data(self):
        """Test creating a project with invalid data"""
        data = {
            'name': '',  # Empty name should be invalid
            'user_id': self.user.id
        }
        response = self.client.post(self.create_url, data)
        
        # Check response indicates error
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_update_project(self):
        """Test updating a project"""
        # Since there's no direct update endpoint, we would test this through the model
        # or create a custom update endpoint test if one exists
        self.project1.name = 'Updated Project'
        self.project1.save()
        
        # Verify the update worked
        updated_project = Project.objects.get(id=self.project1.id)
        self.assertEqual(updated_project.name, 'Updated Project')
    
    def test_delete_project(self):
        """Test deleting a project"""
        # Since there's no direct delete endpoint, we would test this through the model
        # or create a custom delete endpoint test if one exists
        project_id = self.project1.id
        self.project1.delete()
        
        # Verify the project was deleted
        self.assertFalse(Project.objects.filter(id=project_id).exists())
