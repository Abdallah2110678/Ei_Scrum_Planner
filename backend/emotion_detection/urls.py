from django.urls import path
from .views import emotion_detection_view, get_daily_emotions, team_emotions

urlpatterns = [
    path('emotion_detection/', emotion_detection_view, name='emotion_detection'),
    path('daily_emotions/', get_daily_emotions, name='daily_emotions'),
    path('emotion_detection/team_emotions/', team_emotions, name='team_emotions'),
]