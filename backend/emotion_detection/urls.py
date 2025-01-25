from django.urls import path
from . import views

urlpatterns = [
    path('detect-emotions/', views.detect_emotions_view, name='detect_emotions'),
]