from django.urls import path
from .views import emotion_detection_view

urlpatterns = [
    path('emotion_detection/', emotion_detection_view, name='emotion_detection'),
]