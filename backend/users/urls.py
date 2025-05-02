from django.urls import path
from .views import UpdateProfileView

urlpatterns = [
    path('auth/users/me/', UpdateProfileView.as_view(), name='update-profile'),
]
