from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    # Create Task	POST	/api/tasks/
    #Get All Tasks	GET	/api/tasks/
    #Update Task	PUT	/api/tasks/1/
    #Delete Task	DELETE	/api/tasks/1/
]
