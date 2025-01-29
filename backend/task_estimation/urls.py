from django.urls import path
from .views import train_model_view, insert_task_view, predict_task_view

urlpatterns = [
    path('train-model/', train_model_view, name='train_model'),
    path('insert-task/', insert_task_view, name='insert_task'),
    path('predict-task/', predict_task_view, name='predict_task'),
]
