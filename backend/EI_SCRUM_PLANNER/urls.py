"""
URL configuration for EI_SCRUM_PLANNER project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

from users.views import SignInView, SignUpView, LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('emotion_detection.urls')),
    path("api/v1/auth/", include('djoser.urls')),
    path("api/v1/auth/", include('djoser.urls.jwt')),
    path('api/v1/', include('tasks.urls')),
    path('api/v1/sprints/', include('sprints.urls')),
    path('api/projects/', include('projects.urls')),
    path('', include('project_users.urls')),
    path('api/', include('developer_performance.urls')),
    path('api/auth/login/', SignInView.as_view(), name='login'),
    path('api/auth/signup/', SignUpView.as_view(), name='signup'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
]