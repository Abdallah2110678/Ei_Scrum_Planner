from django.urls import path
from . import views

urlpatterns = [
    path('detect_emotions/', views.detect_emotions, name='detect_emotions'),
]
