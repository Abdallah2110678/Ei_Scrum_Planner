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
        """Test that project names must be unique"""
        Project.objects.create(name="Unique Project")
        
        # Attempting to create another project with the same name should raise an error
        with self.assertRaises(Exception):
            Project.objects.create(name="Unique Project")


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
        serializer = ProjectSerializer(data=self.project_data)
        self.assertTrue(serializer.is_valid())
        
        project = serializer.save()
        
        # Check that the project was created with the correct data
        self.assertEqual(project.name, 'Test Project')


class ProjectAPITests(APITestCase):
    """Tests for the Project API endpoints"""
    
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
        
        # Create some test projects
        self.project1 = Project.objects.create(name="Project 1")
        self.project2 = Project.objects.create(name="Project 2")
        
        # URL for project list and detail
        self.list_url = reverse('project-list')
    
    def test_get_project_list(self):
        """Test retrieving a list of projects"""
        response = self.client.get(self.list_url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Check project names are in the response
        project_names = [project['name'] for project in response.data]
        self.assertIn('Project 1', project_names)
        self.assertIn('Project 2', project_names)
    
    def test_create_project(self):
        """Test creating a new project"""
        data = {'name': 'New Project'}
        response = self.client.post(self.list_url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Project')
        
        # Check that the project was created in the database
        self.assertTrue(Project.objects.filter(name='New Project').exists())
    
    def test_create_project_invalid_data(self):
        """Test creating a project with invalid data"""
        data = {'name': ''}  # Empty name should be invalid
        response = self.client.post(self.list_url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
    
    def test_get_project_detail(self):
        """Test retrieving a specific project"""
        url = reverse('project-detail', args=[self.project1.id])
        response = self.client.get(url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Project 1')
    
    def test_update_project(self):
        """Test updating a project"""
        url = reverse('project-detail', args=[self.project1.id])
        data = {'name': 'Updated Project'}
        response = self.client.put(url, data)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Project')
        
        # Check that the project was updated in the database
        self.project1.refresh_from_db()
        self.assertEqual(self.project1.name, 'Updated Project')
    
    def test_delete_project(self):
        """Test deleting a project"""
        url = reverse('project-detail', args=[self.project1.id])
        response = self.client.delete(url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the project was deleted from the database
        self.assertFalse(Project.objects.filter(id=self.project1.id).exists())
