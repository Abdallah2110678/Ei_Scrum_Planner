from django.urls import path
from .views import (
    calculate_developer_productivity_single,
    calculate_developer_productivity_all,
    get_developer_productivity_list,
    get_sprint_overall_productivity,
    generate_dashboard_pdf,
)

urlpatterns = [
    # For one developer (requires ?project_id=)
    path("developer-performance/calculate/<int:user_id>/", calculate_developer_productivity_single),

    # For all developers in a project (requires ?project_id=)
    path("developer-performance/calculate_all/", calculate_developer_productivity_all),
    
    path("developer-performance/overall_sprint_productivity/", get_sprint_overall_productivity),

    path("developer-performance/", get_developer_productivity_list),
    
    path('generate_dashboard_pdf/', generate_dashboard_pdf),
]
