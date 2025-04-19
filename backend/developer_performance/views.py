from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from tasks.models import Task
from developer_performance.models import DeveloperPerformance
from developer_performance.serializers import DeveloperPerformanceSerializer
from projects.models import Project
from project_users.models import ProjectUsers
from django.db.models import Sum, Count

User = get_user_model()

# ------------------------------
# Utility to calculate per-user productivity
# ------------------------------
def calculate_productivity_for_user(user, project_id):
    tasks = Task.objects.filter(user=user, project_id=project_id)

    grouped_data = tasks.values('sprint', 'task_category', 'task_complexity') \
        .annotate(total_tasks=Count('id'), total_effort=Sum('actual_effort'))

    result_entries = []

    for item in grouped_data:
        sprint_id = item['sprint']
        category = item['task_category']
        complexity = item['task_complexity']
        total_tasks = item['total_tasks']
        total_effort = item['total_effort'] or 0.0
        productivity = total_effort / total_tasks if total_tasks else 0

        try:
            performance, _ = DeveloperPerformance.objects.update_or_create(
                user=user,
                project_id=project_id,
                sprint_id=sprint_id,
                category=category,
                complexity=complexity,
                defaults={
                    'total_tasks': total_tasks,
                    'total_actual_effort': total_effort,
                    'productivity': productivity
                }
            )
            result_entries.append(performance)
        except Exception as e:
            print(f"Error saving performance for {user} in sprint {sprint_id}: {e}")

    return result_entries

# ------------------------------
# All developers in a project
# ------------------------------
@api_view(['POST'])
def calculate_developer_productivity_all(request):
    project_id = request.query_params.get('project_id')
    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    user_ids = ProjectUsers.objects.filter(project_id=project_id).values_list('user_id', flat=True)
    users = User.objects.filter(id__in=user_ids)

    all_entries = []
    for user in users:
        entries = calculate_productivity_for_user(user, project_id)
        all_entries.extend(entries)

    serialized = DeveloperPerformanceSerializer(all_entries, many=True)
    return Response(serialized.data, status=status.HTTP_200_OK)

# ------------------------------
# One developer in a project
# ------------------------------
@api_view(['POST'])
def calculate_developer_productivity_single(request, user_id):
    project_id = request.query_params.get('project_id')
    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    entries = calculate_productivity_for_user(user, project_id)
    serialized = DeveloperPerformanceSerializer(entries, many=True)
    return Response(serialized.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_developer_productivity_list(request):
    project_id = request.query_params.get('project_id')
    user_id = request.query_params.get('user_id')
    category = request.query_params.get('task_category')
    complexity = request.query_params.get('task_complexity')
    sprint_id = request.query_params.get('sprint_id')

    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    filters = {'project_id': project_id}

    if user_id:
        filters['user_id'] = user_id
    if category:
        filters['category'] = category
    if complexity:
        filters['complexity'] = complexity
    if sprint_id:
        filters['sprint_id'] = sprint_id

    queryset = DeveloperPerformance.objects.filter(**filters)
    serialized = DeveloperPerformanceSerializer(queryset, many=True)
    return Response(serialized.data, status=status.HTTP_200_OK)