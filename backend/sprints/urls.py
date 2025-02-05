from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SprintViewSet

router = DefaultRouter()
router.register(r'', SprintViewSet, basename='sprint')  # ✅ Registers it at `sprints/`

urlpatterns = [
    path('', include(router.urls)),  # ✅ This must be included
]
