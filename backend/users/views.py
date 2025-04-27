from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User  # Import your custom User model
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import authenticate, login, logout
from .managers import CustomUserManager

class SignUpView(APIView):
    permission_classes = [AllowAny]  # Allow anyone to access this endpoint

    def post(self, request):
        # Extract the data from the request
        data = request.data
        name = data.get("name")
        specialist = data.get("specialist")
        email = data.get("email")
        password = data.get("password")

        # Validate inputs
        if not name or not specialist or not email or not password:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the email already exists
        if User.objects.filter(email=email).exists():
            return Response({"error": "A user with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Create the user using the custom manager
        try:
            user = User.objects.create_user(
                name=name,
                specialist=specialist,
                email=email,
                password=password,
            )
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


class SignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        # Validate input
        if not email or not password:
            return Response(
                {"message": "Email and password are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        user = authenticate(request, email=email, password=password)
        if user is None:
            return Response(
                {"message": "Invalid email or password."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Log the user in and create a session
        login(request, user)
        
        # Generate access token only
        access_token = AccessToken.for_user(user)
        
        # Return the response in the format expected by the frontend
        return Response({
            "access": str(access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "specialist": user.specialist
            }
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Clear the session
            logout(request)
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
