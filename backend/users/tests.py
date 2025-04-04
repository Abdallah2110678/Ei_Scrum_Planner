from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CreateUserSerializer
from unittest.mock import patch

User = get_user_model()

class UserModelTests(TestCase):
    """Tests for the custom User model"""
    
    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            name='Test User',
            specialist='Developer'
        )
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertEqual(user.specialist, 'Developer')
        self.assertTrue(user.check_password('password123'))
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='admin123',
            name='Admin User',
            specialist='Admin',
            is_superuser=True  # Explicitly set is_superuser
        )
        
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertTrue(admin_user.is_superuser)


class UserSerializerTests(TestCase):
    """Tests for the User serializers"""
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'StrongP@ssw0rd123!',  # Use a stronger password
            're_password': 'StrongP@ssw0rd123!',  # Add re_password field
            'name': 'Test User',
            'specialist': 'Developer'
        }
    
    def test_create_user_serializer(self):
        """Test creating a user with the serializer"""
        serializer = CreateUserSerializer(data=self.user_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        user = serializer.save()
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')


class UserAPITests(APITestCase):
    """Tests for the User API endpoints"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            name='Test User',
            specialist='Developer',
        )
        
        self.register_url = reverse('user-list')
        self.login_url = reverse('jwt-create')
        self.me_url = reverse('user-me')
    
    def test_get_user_profile_authenticated(self):
        """Test getting user profile when authenticated"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('name', response.data)
        self.assertEqual(response.data.get('name'), 'Test User')
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        # Create a new user specifically for updating
        user_to_update = User.objects.create_user(
            email='update_me@example.com',
            password='password123',
            name='Original Name',
            specialist='Developer'
        )
        
        # Get token for this user
        refresh = RefreshToken.for_user(user_to_update)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Update the user's name
        data = {'name': 'Updated Name'}
        response = self.client.patch(self.me_url, data)
        
        # Check response status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the response data contains the updated name
        self.assertEqual(response.data['name'], 'Updated Name')
        
        # Refresh the user from the database and verify the update
        user_to_update.refresh_from_db()
        self.assertEqual(user_to_update.name, 'Updated Name')
    
    def test_delete_user_account(self):
        """Test deleting user account"""
        # Create a new user specifically for deletion
        user_to_delete = User.objects.create_user(
            email='delete_me@example.com',
            password='password123',
            name='Delete Me',
            specialist='Developer'
        )
        
        # Get token for this user
        refresh = RefreshToken.for_user(user_to_delete)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Send the required password for account deletion
        data = {'current_password': 'password123'}
        
        # Mock the logout_user function to avoid the Token model error
        with patch('djoser.utils.logout_user'):
            response = self.client.delete(self.me_url, data, format='json')
            
            # Check response status code
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
            
            # Verify the user no longer exists in the database
            with self.assertRaises(User.DoesNotExist):
                User.objects.get(email='delete_me@example.com')
