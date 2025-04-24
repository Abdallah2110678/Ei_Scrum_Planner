from datetime import timezone
from emotion_detection.models import DailyEmotion
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
from django.db.models import Sum, Avg
from django.utils import timezone


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
        if Project.objects.filter(name=name, created_by_id=user_id).exists():
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
    ViewSet for automating task assignments based on productivity, rework, emotion, and capacity.
    """
    def assign_tasks(self, project, sprint):
        """
        Assign unassigned tasks in the sprint to developers based on:
        - Productivity (DeveloperPerformance)
        - Rework count penalty (Task.rework_count)
        - Emotion weight (DailyEmotion.average_emotion_weight, with complexity restriction)
        - Capacity (max 7 hours)
        Returns a list of assignments for logging/response.
        """
        logger.info(f"Starting task assignment for project '{project.name}' (ID: {project.id}), sprint '{sprint.sprint_name}' (ID: {sprint.id})")

        # Fetch developers in the project
        logger.info("Retrieving developers from ProjectUsers")
        project_user_ids = ProjectUsers.objects.filter(project=project).values_list('user_id', flat=True)
        developers = User.objects.filter(id__in=project_user_ids)
        
        if not developers.exists():
            logger.warning(f"No developers found for project '{project.name}'")
            return []
        logger.info(f"Found {developers.count()} developers: {[d.email for d in developers]}")

        # Fetch the last completed sprint for emotion data
        logger.info("Retrieving last completed sprint for emotion data")
        last_sprint = Sprint.objects.filter(
            project=project,
            is_completed=True
        ).order_by('-end_date').first()
        
        developer_emotions = {}
        if last_sprint and last_sprint.start_date and last_sprint.end_date:
            logger.info(
                f"Last sprint '{last_sprint.sprint_name}' (ID: {last_sprint.id}) "
                f"from {last_sprint.start_date.date()} to {last_sprint.end_date.date()}"
            )
            emotion_data = DailyEmotion.objects.filter(
                user__in=developers,
                date__range=[last_sprint.start_date.date(), last_sprint.end_date.date()]
            ).values('user_id').annotate(avg_emotion=Avg('average_emotion_weight'))
            
            for entry in emotion_data:
                developer_emotions[entry['user_id']] = entry['avg_emotion'] or 0.5
                logger.debug(
                    f"Developer ID {entry['user_id']}: "
                    f"average emotion weight={entry['avg_emotion']:.2f}"
                )
        else:
            logger.warning("No completed sprint found or missing date range, using default emotion weight 0.5")
            for developer in developers:
                developer_emotions[developer.id] = 0.5

        # Fetch unassigned tasks in the sprint
        logger.info("Retrieving unassigned tasks for sprint")
        tasks = Task.objects.filter(sprint=sprint, user__isnull=True)
        if not tasks.exists():
            logger.warning(f"No unassigned tasks found for sprint '{sprint.sprint_name}'")
            return []
        logger.info(f"Found {tasks.count()} unassigned tasks: {[t.task_name for t in tasks]}")

        # Map complexity to weight for workload penalty
        complexity_weights = {
            "EASY": 0.5,
            "MEDIUM": 1.0,
            "HARD": 1.5
        }

        # Track assigned hours per developer
        developer_hours = {dev.id: 0 for dev in developers}
        max_capacity = 7.0  # Max hours per developer
        logger.info(f"Initialized capacity tracking: max {max_capacity} hours per developer")

        assignments = []
        
        for task in tasks:
            logger.info(
                f"Processing task '{task.task_name}' (ID: {task.id}, Category: {task.task_category}, "
                f"Complexity: {task.task_complexity}, Estimated Effort: {task.estimated_effort or 'None'}h)"
            )
            
            if not task.estimated_effort:
                logger.warning(f"Task '{task.task_name}' has no estimated_effort, skipping")
                continue

            best_developer = None
            best_score = float('-inf')
            assignment_details = []

            for developer in developers:
                logger.debug(f"Evaluating developer '{developer.email}' for task '{task.task_name}'")

                # Check emotion-based complexity restriction
                emotion_weight = developer_emotions.get(developer.id, 0.5)
                if emotion_weight < 0.7 and task.task_complexity == "HARD":
                    logger.warning(
                        f"Skipping developer '{developer.email}' for task '{task.task_name}' "
                        f"(HARD): low emotion weight ({emotion_weight:.2f} < 0.7)"
                    )
                    continue

                # Check capacity
                if developer_hours[developer.id] + task.estimated_effort > max_capacity:
                    logger.warning(
                        f"Skipping developer '{developer.email}' for task '{task.task_name}': "
                        f"would exceed capacity ({developer_hours[developer.id]} + {task.estimated_effort} > {max_capacity})"
                    )
                    continue

                # Productivity score
                logger.debug(f"Calculating productivity score for '{developer.email}'")
                performance = DeveloperPerformance.objects.filter(
                    user=developer,
                    project=project,
                    sprint__in=project.sprints.filter(is_completed=True),
                    category=task.task_category,
                    complexity=task.task_complexity
                ).order_by('-productivity').first()
                productivity = performance.productivity if performance else 1.0
                productivity_score = 1.0 / max(productivity, 0.1)  # Invert for higher-is-better
                productivity_score = min(productivity_score / 2.0, 1.0)  # Normalize to 0-1
                logger.debug(
                    f"Productivity: raw={productivity:.2f}, score={productivity_score:.2f} "
                    f"({'from performance' if performance else 'default'})"
                )

                # Rework penalty
                logger.debug(f"Calculating rework penalty for '{developer.email}'")
                try:
                    rework_count = Task.objects.filter(
                        user=developer,
                        project=project,
                        task_category=task.task_category,
                        task_complexity=task.task_complexity,
                        rework_count__gt=0
                    ).aggregate(total_rework=Sum('rework_count'))['total_rework'] or 0
                    logger.debug(f"Rework count: {rework_count}")
                except Exception as e:
                    logger.error(
                        f"Error calculating rework_count for '{developer.email}', "
                        f"task '{task.task_name}': {str(e)}"
                    )
                    rework_count = 0
                rework_penalty = min(rework_count * 0.2, 1.0)  # Normalize to 0-1
                logger.debug(f"Rework penalty: {rework_penalty:.2f}")

                # Emotion score
                logger.debug(f"Calculating emotion score for '{developer.email}'")
                if emotion_weight >= 0.9:
                    emotion_score = 1.0
                elif emotion_weight >= 0.8:
                    emotion_score = 0.8
                elif emotion_weight >= 0.7:
                    emotion_score = 0.6
                else:
                    emotion_score = 0.4
                logger.debug(
                    f"Emotion: weight={emotion_weight:.2f}, score={emotion_score:.2f} "
                    f"({'from last sprint' if developer.id in developer_emotions else 'default'})"
                )

                # Workload penalty
                logger.debug(f"Calculating workload penalty for '{developer.email}'")
                workload_score = developer_hours[developer.id] * complexity_weights.get(task.task_complexity, 1.0)
                workload_penalty = min(workload_score * 0.1, 1.0)  # Normalize to 0-1
                logger.debug(f"Workload: hours={developer_hours[developer.id]:.2f}, penalty={workload_penalty:.2f}")

                # Total score
                score = (0.4 * productivity_score) - (0.3 * rework_penalty) + (0.3 * emotion_score) - (0.1 * workload_penalty)
                logger.debug(
                    f"Total score for '{developer.email}': "
                    f"(0.4 * {productivity_score:.2f}) - (0.3 * {rework_penalty:.2f}) + "
                    f"(0.3 * {emotion_score:.2f}) - (0.1 * {workload_penalty:.2f}) = {score:.2f}"
                )

                assignment_details.append({
                    'developer': developer.email,
                    'productivity_score': productivity_score,
                    'rework_penalty': rework_penalty,
                    'emotion_score': emotion_score,
                    'workload_penalty': workload_penalty,
                    'total_score': score
                })

                if score > best_score:
                    best_score = score
                    best_developer = developer

            if best_developer and best_score > 0:
                # Assign the task
                logger.info(
                    f"Assigning task '{task.task_name}' to '{best_developer.email}' "
                    f"with score {best_score:.2f}"
                )
                task.user = best_developer
                task.save()
                developer_hours[best_developer.id] += task.estimated_effort
                logger.info(
                    f"Updated capacity for '{best_developer.email}': "
                    f"{developer_hours[best_developer.id]:.2f}/{max_capacity} hours"
                )
                assignments.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': best_developer.email,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'estimated_effort': task.estimated_effort,
                    'score': best_score
                })
            else:
                logger.warning(
                    f"No suitable developer found for task '{task.task_name}' "
                    f"(Category: {task.task_category}, Complexity: {task.task_complexity})"
                )
                assignments.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': None,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'estimated_effort': task.estimated_effort,
                    'score': None
                })

            # Log assignment details
            logger.debug(f"Assignment details for task '{task.task_name}': {assignment_details}")

        logger.info(f"Completed task assignment: {len([a for a in assignments if a['developer']])} tasks assigned")
        return assignments

    @action(detail=False, methods=['post'], url_path='auto-assign-tasks')
    def auto_assign_tasks(self, request):
        """
        API endpoint to trigger automatic task assignment.
        Expects project_id and sprint_id in the request body.
        """
        logger.info("Received auto-assign-tasks request")
        project_id = request.data.get('project_id')
        sprint_id = request.data.get('sprint_id')

        if not project_id or not sprint_id:
            logger.error("Missing project_id or sprint_id in request")
            return Response(
                {"error": "project_id and sprint_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.debug(f"Processing request: project_id={project_id}, sprint_id={sprint_id}")
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
            logger.warning(f"Automation disabled for project '{project.name}'")
            return Response(
                {"error": "Automation is disabled. At least two sprints must be completed."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not sprint.is_active:
            logger.warning(f"Sprint '{sprint.sprint_name}' is not active")
            return Response(
                {"error": "Cannot assign tasks to an inactive sprint"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Perform task assignments
        logger.info("Initiating task assignment process")
        assignments = self.assign_tasks(project, sprint)
        
        if not assignments:
            logger.info("No tasks assigned (no unassigned tasks or developers available)")
            return Response(
                {"message": "No tasks were assigned (no unassigned tasks or developers available)"},
                status=status.HTTP_200_OK
            )

        assigned_count = sum(1 for a in assignments if a['developer'] is not None)
        logger.info(f"Request completed: assigned {assigned_count} of {len(assignments)} tasks")
        return Response(
            {
                "message": f"Assigned {assigned_count} of {len(assignments)} tasks successfully",
                "assignments": assignments
            },
            status=status.HTTP_200_OK
        )