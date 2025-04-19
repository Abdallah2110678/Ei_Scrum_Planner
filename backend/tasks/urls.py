# tasks/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, train_effort_model, predict_effort_view, task_meta_view, rework_effort_view

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path("train/", train_effort_model),
    path('meta/', task_meta_view),
    path('rework-effort/', rework_effort_view),
    path("predict/", predict_effort_view),
]
