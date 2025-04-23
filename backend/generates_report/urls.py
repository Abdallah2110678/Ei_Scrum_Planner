from django.urls import path
from . import views

urlpatterns = [
    path('generate_dashboard_pdf/', views.generate_dashboard_pdf, name='generate_dashboard_pdf'),
]