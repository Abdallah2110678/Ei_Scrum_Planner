from rest_framework import viewsets
from .models import Project
from .serializers import ProjectSerializer

from rest_framework.decorators import action

from django.contrib.auth import get_user_model
from projects.models import Project
from sprints.models import Sprint
from tasks.models import Task
from developer_performance.models import DeveloperPerformance
from project_users.models import ProjectUsers
import logging


# projects/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Project
from users.models import User
from .serializers import ProjectSerializer


logger = logging.getLogger(__name__)

User = get_user_model()

class CreateProject(APIView):
    """
    Creates a project with a specified creator (user ID) provided in the request.
    Does not require authentication.
    """
    def post(self, request):
        name = request.data.get("name")
        user_id = request.data.get("user_id")  # Use user_id instead of email

        # Validate inputs
        if not name:
            return Response({"error": "Project name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Try to convert user_id to integer if it's a string
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response({"error": "A valid user ID (integer) is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if project name is unique
        if Project.objects.filter(name=name).exists():
            return Response({"error": "A project with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Find the user by ID
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": f"User with ID {user_id} does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        # Create the project
        project = Project.objects.create(
            name=name,
            created_by=user
        )

        # Return success response
        return Response(
            {
                "message": "Project created successfully",
                "data": ProjectSerializer(project).data
            },
            status=status.HTTP_201_CREATED
        )
    

class GetProjectsByUser(APIView):
    """
    Fetches all project names and IDs where the user is either the creator (Project.created_by)
    or a participant (ProjectUsers.user), matching the given user ID.
    """
    def get(self, request, user_id):
        # Validate user_id
        if not isinstance(user_id, int):
            return Response({"error": "Invalid user ID"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        user = get_object_or_404(User, id=user_id)

        # Fetch projects where user is the creator
        created_projects = Project.objects.filter(created_by=user)

        # Fetch projects where user is a participant
        participated_projects = Project.objects.filter(project_users__user=user)

        # Combine and remove duplicates
        all_projects = created_projects | participated_projects
        all_projects = all_projects.distinct()

        # Serialize to get only id and name
        serializer = ProjectSerializer(all_projects, many=True)

        # Return response
        return Response(
            {
                "message": "Projects retrieved successfully",
                "user_id": user_id,
                "projects": serializer.data
            },
            status=status.HTTP_200_OK
        )
class ProjectViewSet(viewsets.ModelViewSet):
    """
    API View for Projects
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer





class TaskAssignmentViewSet(viewsets.ViewSet):
    """
    ViewSet for automating task assignments based on developer performance,
    task category, complexity, and rework count.
    """
    def assign_tasks(self, project, sprint):
        """
        Assign unassigned tasks in the sprint to developers based on:
        - Productivity in task category and complexity (DeveloperPerformance)
        - Rework count penalty (Task.rework_count)
        - Workload balance
        Returns a list of assignments for logging/response.
        """
        # Fetch developers in the project
        project_user_ids = ProjectUsers.objects.filter(project=project).values_list('user_id', flat=True)
        developers = User.objects.filter(id__in=project_user_ids)
        
        if not developers.exists():
            logger.warning(f"No developers found for project {project.name}")
            return []

        # Fetch unassigned tasks in the sprint
        tasks = Task.objects.filter(sprint=sprint, user__isnull=True)
        if not tasks.exists():
            logger.warning(f"No unassigned tasks found for sprint {sprint.sprint_name}")
            return []

        # Map complexity to weight for workload penalty
        complexity_weights = {
            "EASY": 0.5,
            "MEDIUM": 1.0,
            "HARD": 1.5
        }

        assignments = []
        
        for task in tasks:
            best_developer = None
            best_score = float('-inf')
            assignment_details = []

            for developer in developers:
                # Get performance data for this developer in the task's category and complexity
                performance = DeveloperPerformance.objects.filter(
                    user=developer,
                    project=project,
                    sprint__in=project.sprints.filter(is_completed=True),
                    category=task.task_category,
                    complexity=task.task_complexity
                ).order_by('-productivity').first()

                # Calculate productivity score (invert productivity for higher-is-better)
                productivity = performance.productivity if performance else 1.0  # Default to neutral
                productivity_score = 1.0 / max(productivity, 0.1)  # Avoid division by zero

                # Calculate rework penalty
                rework_count = Task.objects.filter(
                    user=developer,
                    project=project,
                    task_category=task.task_category,
                    task_complexity=task.task_complexity,
                    rework_count__gt=0
                ).aggregate(total_rework=sum('rework_count'))['total_rework'] or 0
                rework_penalty = rework_count * 0.2  # Adjust penalty weight as needed

                # Calculate workload penalty
                current_tasks = Task.objects.filter(
                    sprint=sprint,
                    user=developer,
                    status__in=["TO DO", "IN PROGRESS"]
                )
                workload_score = 0
                for t in current_tasks:
                    weight = complexity_weights.get(t.task_complexity, 1.0)
                    workload_score += weight
                workload_penalty = workload_score * 0.1  # Adjust penalty weight

                # Total score
                score = productivity_score - rework_penalty - workload_penalty

                assignment_details.append({
                    'developer': developer.email,
                    'productivity_score': productivity_score,
                    'rework_penalty': rework_penalty,
                    'workload_penalty': workload_penalty,
                    'total_score': score
                })

                if score > best_score:
                    best_score = score
                    best_developer = developer

            if best_developer and best_score > 0:  # Only assign if score is positive
                # Assign the task
                task.user = best_developer
                task.save()
                assignments.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': best_developer.email,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'score': best_score
                })
                logger.info(
                    f"Assigned task {task.task_name} (Category: {task.task_category}, "
                    f"Complexity: {task.task_complexity}) to {best_developer.email} "
                    f"with score {best_score:.2f}"
                )
            else:
                logger.warning(
                    f"No suitable developer found for task {task.task_name} "
                    f"(Category: {task.task_category}, Complexity: {task.task_complexity})"
                )
                assignments.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': None,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'score': None
                })

            # Log assignment details for debugging
            logger.debug(f"Assignment details for task {task.task_name}: {assignment_details}")

        return assignments

    @action(detail=False, methods=['post'], url_path='auto-assign-tasks')
    def auto_assign_tasks(self, request):
        """
        API endpoint to trigger automatic task assignment.
        Expects project_id and sprint_id in the request body.
        """
        project_id = request.data.get('project_id')
        sprint_id = request.data.get('sprint_id')

        if not project_id or not sprint_id:
            logger.error("Missing project_id or sprint_id in request")
            return Response(
                {"error": "project_id and sprint_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            project = Project.objects.get(id=project_id)
            sprint = Sprint.objects.get(id=sprint_id, project=project)
        except Project.DoesNotExist:
            logger.error(f"Project {project_id} not found")
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        except Sprint.DoesNotExist:
            logger.error(f"Sprint {sprint_id} not found in project {project_id}")
            return Response({"error": "Sprint not found"}, status=status.HTTP_404_NOT_FOUND)

        if not project.enable_automation:
            logger.warning(f"Automation disabled for project {project.name}")
            return Response(
                {"error": "Automation is disabled. At least two sprints must be completed."},
                status=status.HTTP_403_FORBIDDEN
            )


        # Perform task assignments
        assignments = self.assign_tasks(project, sprint)
        
        if not assignments:
            return Response(
                {"message": "No tasks were assigned (no unassigned tasks or developers available)"},
                status=status.HTTP_200_OK
            )

        assigned_count = sum(1 for a in assignments if a['developer'] is not None)
        return Response(
            {
                "message": f"Assigned {assigned_count} of {len(assignments)} tasks successfully",
                "assignments": assignments
            },
            status=status.HTTP_200_OK
        )