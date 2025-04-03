from django.urls import path
from .views import (
    calculate_developer_productivity,
    calculate_task_productivity,
    calculate_sprint_productivity,
)

urlpatterns = [
    path('developer-productivity/<int:user_id>/', calculate_developer_productivity),
    path('task-productivity/<int:task_id>/', calculate_task_productivity),
    path('sprint-productivity/<int:sprint_id>/', calculate_sprint_productivity),
]
