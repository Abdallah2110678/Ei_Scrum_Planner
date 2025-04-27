import logging
from datetime import timezone

from developer_performance.models import DeveloperPerformance
from django.contrib.auth import get_user_model
from django.db.models import Avg, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from emotion_detection.models import DailyEmotion
from project_users.models import ProjectUsers
from projects.models import Project
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
# projects/views.py
from rest_framework.views import APIView
from sprints.models import Sprint
from tasks.models import Task
from users.models import User
from datetime import timezone
from copy import deepcopy

from .models import Project
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
    Uses a Constraint Satisfaction Problem (CSP) approach with backtracking to optimize assignments.
    """
    
    def get_performance_data(self, project, developers):
        """
        Retrieve performance data for all developers in this project
        Returns a nested dictionary {developer_id: {(category, complexity): productivity}}
        """
        logger.info(f"Retrieving performance data for {len(developers)} developers")
        performance_data = {dev.id: {} for dev in developers}
        
        # Get all performance records for all developers in completed sprints
        performances = DeveloperPerformance.objects.filter(
            user__in=developers,
            project=project,
            sprint__in=project.sprints.filter(is_completed=True)
        )
        
        # Organize by developer_id, category, and complexity
        for perf in performances:
            key = (perf.category, perf.complexity)
            if key not in performance_data[perf.user_id]:
                performance_data[perf.user_id][key] = []
            performance_data[perf.user_id][key].append(perf.productivity)
        
        # Average productivity for each category/complexity combination
        for dev_id in performance_data:
            for key in list(performance_data[dev_id].keys()):
                if performance_data[dev_id][key]:
                    # Use the average of all performances
                    performance_data[dev_id][key] = sum(performance_data[dev_id][key]) / len(performance_data[dev_id][key])
                else:
                    # Default productivity if no data
                    performance_data[dev_id][key] = 1.0
        
        return performance_data
    
    def get_rework_data(self, project, developers):
        """
        Retrieve rework data for all developers in this project
        Returns a nested dictionary {developer_id: {(category, complexity): rework_count}}
        """
        logger.info(f"Retrieving rework data for {len(developers)} developers")
        rework_data = {dev.id: {} for dev in developers}
        
        # For each developer, get rework count by category and complexity
        for dev in developers:
            # Group tasks by category and complexity, sum their rework counts
            tasks = Task.objects.filter(
                user=dev,
                project=project,
                rework_count__gt=0
            ).values('task_category', 'task_complexity').annotate(
                total_rework=Sum('rework_count')
            )
            
            for task in tasks:
                key = (task['task_category'], task['task_complexity'])
                rework_data[dev.id][key] = task['total_rework']
        
        return rework_data
    
    def get_emotion_data(self, project, developers):
        """
        Retrieve emotion data for all developers from the last completed sprint
        Returns a dictionary {developer_id: emotion_weight}
        """
        logger.info(f"Retrieving emotion data for {len(developers)} developers")
        developer_emotions = {dev.id: 0.5 for dev in developers}  # Default value
        
        # Find the last completed sprint
        last_sprint = Sprint.objects.filter(
            project=project,
            is_completed=True
        ).order_by('-end_date').first()
        
        if last_sprint and last_sprint.start_date and last_sprint.end_date:
            logger.info(
                f"Using emotion data from sprint '{last_sprint.sprint_name}' "
                f"({last_sprint.start_date.date()} to {last_sprint.end_date.date()})"
            )
            
            emotion_data = DailyEmotion.objects.filter(
                user__in=developers,
                date__range=[last_sprint.start_date.date(), last_sprint.end_date.date()]
            ).values('user_id').annotate(avg_emotion=Avg('average_emotion_weight'))
            
            for entry in emotion_data:
                developer_emotions[entry['user_id']] = entry['avg_emotion'] or 0.5
        else:
            logger.warning("No completed sprint found for emotion data, using defaults")
            
        return developer_emotions
    
    def calculate_task_score(self, task, developer_id, performance_data, rework_data, emotion_data, current_hours):
        """
        Calculate score for assigning this task to this developer
        """
        # Get parameters
        key = (task.task_category, task.task_complexity)
        emotion_weight = emotion_data.get(developer_id, 0.5)
        complexity_weights = {"EASY": 0.5, "MEDIUM": 1.0, "HARD": 1.5}
        
        # Check emotion-based complexity restriction
        if emotion_weight < 0.7 and task.task_complexity == "HARD":
            return float('-inf')  # Disqualify this assignment
        
        # Productivity score
        productivity = performance_data.get(developer_id, {}).get(key, 1.0)
        productivity_score = 1.0 / max(productivity, 0.1)  # Invert for higher-is-better
        productivity_score = min(productivity_score / 2.0, 1.0)  # Normalize to 0-1
        
        # Rework penalty
        rework_count = rework_data.get(developer_id, {}).get(key, 0)
        rework_penalty = min(rework_count * 0.2, 1.0)  # Normalize to 0-1
        
        # Emotion score
        if emotion_weight >= 0.9:
            emotion_score = 1.0
        elif emotion_weight >= 0.8:
            emotion_score = 0.8
        elif emotion_weight >= 0.7:
            emotion_score = 0.6
        else:
            emotion_score = 0.4
        
        # Workload penalty
        workload_score = current_hours * complexity_weights.get(task.task_complexity, 1.0)
        workload_penalty = min(workload_score * 0.1, 1.0)  # Normalize to 0-1
        
        # Total score
        score = (0.4 * productivity_score) - (0.3 * rework_penalty) + (0.3 * emotion_score) - (0.1 * workload_penalty)
        
        return score
    
    def csp_assignment_with_backtracking(self, project, sprint, tasks, developers, performance_data, rework_data, emotion_data):
        """
        Assign tasks using Constraint Satisfaction Problem approach with backtracking
        Returns the best assignment found
        """
        logger.info(f"Starting CSP assignment with backtracking for {len(tasks)} tasks and {len(developers)} developers")
        max_capacity = 60.0  # Max hours per developer
        
        # Sort tasks by complexity (more complex first) and estimated effort
        sorted_tasks = sorted(
            tasks, 
            key=lambda t: (
                2 if t.task_complexity == "HARD" else 1 if t.task_complexity == "MEDIUM" else 0,
                t.estimated_effort or 0
            ), 
            reverse=True
        )
        
        # Create initial domains for each task (eligible developers)
        domains = {}
        for task in sorted_tasks:
            if not task.estimated_effort:
                logger.warning(f"Task '{task.task_name}' has no estimated effort, skipping")
                continue
                
            domains[task.id] = []
            for developer in developers:
                # Check emotion-based complexity restriction
                emotion_weight = emotion_data.get(developer.id, 0.5)
                if emotion_weight < 0.7 and task.task_complexity == "HARD":
                    continue
                    
                # Calculate score
                score = self.calculate_task_score(
                    task, developer.id, performance_data, rework_data, 
                    emotion_data, 0  # Initial hours = 0
                )
                
                if score > 0:
                    domains[task.id].append((developer.id, score))
            
            # Sort domains by score (highest first)
            domains[task.id].sort(key=lambda x: x[1], reverse=True)
        
        # Function for recursive backtracking
        def backtrack(assignment, remaining_tasks, developer_hours):
            if not remaining_tasks:
                return assignment  # Solution found
                
            # Choose task with fewest remaining eligible developers (MRV heuristic)
            task_id = min(
                remaining_tasks,
                key=lambda tid: len([d for d, s in domains[tid] if developer_hours[d] + next((t.estimated_effort for t in sorted_tasks if t.id == tid), 0) <= max_capacity])
            )
            task = next(t for t in sorted_tasks if t.id == task_id)
            
            # Try each developer in order of descending score
            for dev_id, score in domains[task_id]:
                # Check capacity constraint
                if developer_hours[dev_id] + task.estimated_effort > max_capacity:
                    continue
                    
                # Try this assignment
                new_assignment = assignment.copy()
                new_assignment[task_id] = dev_id
                
                new_developer_hours = developer_hours.copy()
                new_developer_hours[dev_id] += task.estimated_effort
                
                new_remaining = remaining_tasks.copy()
                new_remaining.remove(task_id)
                
                # Recalculate scores for remaining tasks based on updated hours
                new_domains = deepcopy(domains)
                for tid in new_remaining:
                    remaining_task = next(t for t in sorted_tasks if t.id == tid)
                    new_domains[tid] = []
                    for developer in developers:
                        # Skip if already at capacity
                        if new_developer_hours[developer.id] + remaining_task.estimated_effort > max_capacity:
                            continue
                            
                        # Recalculate score with updated hours
                        score = self.calculate_task_score(
                            remaining_task, developer.id, performance_data, rework_data,
                            emotion_data, new_developer_hours[developer.id]
                        )
                        
                        if score > 0:
                            new_domains[tid].append((developer.id, score))
                    
                    # Sort domains by score (highest first)
                    new_domains[tid].sort(key=lambda x: x[1], reverse=True)
                
                # Recursive call
                result = backtrack(new_assignment, new_remaining, new_developer_hours)
                if result:
                    return result
            
            return None  # No solution found for this path
        
        # Start backtracking
        initial_assignment = {}
        initial_developer_hours = {dev.id: 0 for dev in developers}
        task_ids = [task.id for task in sorted_tasks if task.id in domains]
        
        result = backtrack(initial_assignment, set(task_ids), initial_developer_hours)
        
        if not result:
            logger.warning("No complete solution found, falling back to greedy approach")
            # Fall back to greedy approach
            greedy_assignment = {}
            greedy_hours = {dev.id: 0 for dev in developers}
            
            for task in sorted_tasks:
                if task.id not in domains:
                    continue
                    
                best_dev_id = None
                best_score = float('-inf')
                
                for dev_id, score in domains[task.id]:
                    if greedy_hours[dev_id] + task.estimated_effort <= max_capacity and score > best_score:
                        best_dev_id = dev_id
                        best_score = score
                
                if best_dev_id:
                    greedy_assignment[task.id] = best_dev_id
                    greedy_hours[best_dev_id] += task.estimated_effort
            
            result = greedy_assignment
        
        # Convert result to assignments list
        assignments = []
        developer_dict = {dev.id: dev for dev in developers}
        
        for task in sorted_tasks:
            dev_id = result.get(task.id)
            if dev_id:
                assignments.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': developer_dict[dev_id].email,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'estimated_effort': task.estimated_effort,
                    'score': next((s for d, s in domains[task.id] if d == dev_id), None)
                })
                
                # Update the actual task in the database
                task.user = developer_dict[dev_id]
                task.save()
            else:
                assignments.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': None,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'estimated_effort': task.estimated_effort,
                    'score': None
                })
        
        return assignments
    
    def assign_tasks(self, project, sprint):
        """
        Assign unassigned tasks in the sprint to developers using CSP with backtracking.
        Returns a list of assignments for logging/response.
        """
        logger.info(f"Starting CSP task assignment for project '{project.name}', sprint '{sprint.sprint_name}'")
        
        # Fetch developers in the project
        project_user_ids = ProjectUsers.objects.filter(project=project).values_list('user_id', flat=True)
        developers = User.objects.filter(id__in=project_user_ids)
        
        if not developers.exists():
            logger.warning(f"No developers found for project '{project.name}'")
            return []
        
        # Fetch unassigned tasks in the sprint
        tasks = Task.objects.filter(sprint=sprint, user__isnull=True)
        if not tasks.exists():
            logger.warning(f"No unassigned tasks found for sprint '{sprint.sprint_name}'")
            return []
        
        # Get performance, rework, and emotion data
        performance_data = self.get_performance_data(project, developers)
        rework_data = self.get_rework_data(project, developers)
        emotion_data = self.get_emotion_data(project, developers)
        
        # Run CSP assignment algorithm
        assignments = self.csp_assignment_with_backtracking(
            project, sprint, tasks, developers,
            performance_data, rework_data, emotion_data
        )
        
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