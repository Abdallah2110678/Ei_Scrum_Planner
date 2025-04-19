from django.urls import path, include
from .views import TaskViewSet,train_effort_model, predict_effort_view, task_meta_view,rework_effort_view

urlpatterns = [
    path("train/", train_effort_model),
    path('tasks/meta/', task_meta_view),
    path('rework-effort/', rework_effort_view),
    path("predict/", predict_effort_view),
]
