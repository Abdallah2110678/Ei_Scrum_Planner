import logging
from datetime import datetime, timedelta  #

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
from copy import deepcopy
import math

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
    Uses a Constraint Satisfaction Problem (CSP) approach with backtracking to optimize assignments,
    ensuring fair distribution of tasks among developers.
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
        
        # Hard constraint: Don't assign hard tasks to developers with low emotional state
        if emotion_weight < 0.6 and task.task_complexity == "HARD":
            return -100.0  # Use a very low score instead of -infinity
        
        # Productivity score (higher is better)
        productivity = performance_data.get(developer_id, {}).get(key, 1.0)
        
        # Ensure productivity is a valid number
        if not isinstance(productivity, (int, float)) or math.isnan(productivity) or math.isinf(productivity):
            productivity = 1.0
            
        productivity_score = productivity  # Higher productivity gives higher score directly
        productivity_score = min(productivity_score, 2.0) / 2.0  # Normalize to 0-1
        
        # Rework penalty (more rework means lower score)
        rework_count = rework_data.get(developer_id, {}).get(key, 0)
        rework_penalty = min(rework_count * 0.2, 0.8)  # Cap at 0.8
        
        # Emotion score
        if emotion_weight >= 0.9:
            emotion_score = 1.0
        elif emotion_weight >= 0.8:
            emotion_score = 0.9
        elif emotion_weight >= 0.7:
            emotion_score = 0.8
        elif emotion_weight >= 0.6:
            emotion_score = 0.7
        else:
            emotion_score = 0.5
        
        # Workload balance factor (penalize assigning to already busy developers)
        complexity_factor = complexity_weights.get(task.task_complexity, 1.0)
        
        # Ensure current_hours is a valid number
        if not isinstance(current_hours, (int, float)) or math.isnan(current_hours) or math.isinf(current_hours):
            current_hours = 0
            
        workload_factor = max(0, 1.0 - (current_hours / 35.0))  # Decreases as hours increase
        
        # Category specialization bonus (encourage matching developer to their specialty)
        specialization_bonus = 0.0
        if key in performance_data.get(developer_id, {}):
            if performance_data[developer_id][key] > 1.2:  # Developer has high productivity in this category
                specialization_bonus = 0.2
        
        # Total score - weights should sum to 1.0
        score = (
            (0.3 * productivity_score) +
            (0.2 * emotion_score) +
            (0.2 * workload_factor) +
            (0.1 * specialization_bonus) -
            (0.2 * rework_penalty)
        )
        
        # Ensure the score is a valid number for JSON serialization
        if math.isnan(score) or math.isinf(score):
            return 0.0
            
        return score
    
    def enforce_fair_distribution(self, tasks, developers, max_capacity):
        """
        Calculate minimum and maximum task count/hours per developer to ensure fair distribution
        Returns min_tasks_per_dev, max_tasks_per_dev, min_hours_per_dev, max_hours_per_dev
        """
        total_tasks = len(tasks)
        total_estimated_hours = sum(task.estimated_effort or 0 for task in tasks)
        num_developers = len(developers)
        
        # Calculate fair distribution targets
        avg_tasks_per_dev = total_tasks / num_developers
        min_tasks_per_dev = max(1, int(avg_tasks_per_dev * 0.5))  # At least half the average
        max_tasks_per_dev = min(int(avg_tasks_per_dev * 1.5) + 1, total_tasks)  # At most 1.5x the average
        
        avg_hours_per_dev = total_estimated_hours / num_developers
        min_hours_per_dev = max(1, avg_hours_per_dev * 0.4)  # At least 40% of average hours
        max_hours_per_dev = min(avg_hours_per_dev * 1.6, max_capacity)  # At most 160% of average, up to max capacity
        
        logger.info(f"Fair distribution targets: {min_tasks_per_dev}-{max_tasks_per_dev} tasks per dev, "
                   f"{min_hours_per_dev:.1f}-{max_hours_per_dev:.1f} hours per dev")
        
        return min_tasks_per_dev, max_tasks_per_dev, min_hours_per_dev, max_hours_per_dev
    
    def get_developer_skills(self, project, developers):
        """
        Identify developer skills/specialties based on past performance
        Returns {developer_id: [top_categories]}
        """
        dev_skills = {dev.id: [] for dev in developers}
        
        # Get completed tasks data
        for dev in developers:
            # Get categories where developer performed well
            perf_data = DeveloperPerformance.objects.filter(
                user=dev,
                project=project,
                productivity__gt=1.1  # Good performance threshold
            ).values('category').annotate(
                avg_prod=Avg('productivity')
            ).order_by('-avg_prod')
            
            # Store top 3 categories
            for item in perf_data[:3]:
                dev_skills[dev.id].append(item['category'])
        
        return dev_skills
    
    def csp_assignment_with_fairness(self, project, sprint, tasks, developers, performance_data, rework_data, emotion_data):
        """
        Assign tasks using CSP approach with fairness constraints
        """
        logger.info(f"Starting CSP assignment with fairness for {len(tasks)} tasks and {len(developers)} developers")
        
        # Calculate max capacity based on sprint duration
        max_capacity = 0
        if sprint.start_date and sprint.end_date:
            current_date = sprint.start_date.date()
            end_date = sprint.end_date.date()
            business_days = 0
            
            while current_date <= end_date:
                # Skip weekends (5=Saturday, 6=Sunday)
                if current_date.weekday() < 5:
                    business_days += 1
                current_date += timedelta(days=1)
            
            # Each business day has 7 working hours
            max_capacity = business_days * 7.0
        else:
            # Fallback: use duration field or default to 35 hours
            max_capacity = 35.0
            if sprint.duration:
                weeks = sprint.duration / 7
                business_days = weeks * 5
                max_capacity = business_days * 7.0
        
        logger.info(f"Maximum capacity per developer: {max_capacity} hours based on sprint duration")
        
        # Get developer skills/specialties
        dev_skills = self.get_developer_skills(project, developers)
        
        # Calculate fairness thresholds
        min_tasks, max_tasks, min_hours, max_hours = self.enforce_fair_distribution(tasks, developers, max_capacity)
        
        # Get tasks with valid estimated effort
        valid_tasks = [task for task in tasks if task.estimated_effort]
        if len(valid_tasks) < len(tasks):
            logger.warning(f"Skipping {len(tasks) - len(valid_tasks)} tasks with no estimated effort")
        
        # Sort tasks by complexity and category (to group similar tasks)
        sorted_tasks = sorted(
            valid_tasks, 
            key=lambda t: (
                2 if t.task_complexity == "HARD" else 1 if t.task_complexity == "MEDIUM" else 0,
                t.task_category,
                t.estimated_effort or 0
            ), 
            reverse=True
        )
        
        # Start assignment process
        assignments = {}
        developer_hours = {dev.id: 0 for dev in developers}
        developer_task_count = {dev.id: 0 for dev in developers}
        
        # First pass: Assign tasks to developers based on specialization and score
        for task in sorted_tasks:
            # Find best developer for this task
            best_dev_id = None
            best_score = float('-inf')
            
            for dev in developers:
                # Skip if already at maximum tasks or hours
                if developer_task_count[dev.id] >= max_tasks:
                    continue
                if developer_hours[dev.id] + task.estimated_effort > max_hours:
                    continue
                
                # Calculate score for this assignment
                score = self.calculate_task_score(
                    task, dev.id, performance_data, rework_data, 
                    emotion_data, developer_hours[dev.id]
                )
                
                # Add bonus for specialization
                if task.task_category in dev_skills.get(dev.id, []):
                    score += 0.1
                
                if score > best_score:
                    best_score = score
                    best_dev_id = dev.id
            
            # If found a suitable developer, assign the task
            if best_dev_id is not None:
                assignments[task.id] = best_dev_id
                developer_hours[best_dev_id] += task.estimated_effort
                developer_task_count[best_dev_id] += 1
        
        # Second pass: Ensure minimum tasks per developer
        unassigned_tasks = [t for t in sorted_tasks if t.id not in assignments]
        dev_below_min = [dev.id for dev in developers if developer_task_count[dev.id] < min_tasks]
        
        if dev_below_min and unassigned_tasks:
            logger.info(f"Second pass: Ensuring minimum tasks for {len(dev_below_min)} developers below threshold")
            
            # Sort unassigned tasks by complexity (easier first)
            unassigned_tasks.sort(
                key=lambda t: (
                    0 if t.task_complexity == "EASY" else 1 if t.task_complexity == "MEDIUM" else 2,
                    t.estimated_effort or 0
                )
            )
            
            # For each developer below minimum, try to assign tasks
            for dev_id in dev_below_min:
                needed_tasks = min_tasks - developer_task_count[dev_id]
                remaining_capacity = max_hours - developer_hours[dev_id]
                
                for task in list(unassigned_tasks):
                    if needed_tasks <= 0:
                        break
                    
                    if task.estimated_effort <= remaining_capacity:
                        assignments[task.id] = dev_id
                        developer_hours[dev_id] += task.estimated_effort
                        developer_task_count[dev_id] += 1
                        remaining_capacity -= task.estimated_effort
                        needed_tasks -= 1
                        unassigned_tasks.remove(task)
        
        # Third pass: Assign any remaining tasks based on capacity
        if unassigned_tasks:
            logger.info(f"Third pass: Assigning {len(unassigned_tasks)} remaining tasks")
            
            for task in unassigned_tasks:
                # Find developer with most remaining capacity
                best_dev_id = None
                best_remaining = -1
                
                for dev in developers:
                    remaining = max_hours - developer_hours[dev.id]
                    if remaining >= task.estimated_effort and remaining > best_remaining:
                        best_dev_id = dev.id
                        best_remaining = remaining
                
                if best_dev_id is not None:
                    assignments[task.id] = best_dev_id
                    developer_hours[best_dev_id] += task.estimated_effort
                    developer_task_count[best_dev_id] += 1
        
        
        # Fourth pass: Force assign remaining tasks to anyone with enough space
        if unassigned_tasks:
            logger.warning(f"⚠️ Fourth pass: Forcing assignment of {len(unassigned_tasks)} unassigned tasks")

            for task in list(unassigned_tasks):
                # Prioritize developers below min_tasks even if they are slightly over max_hours
                for dev in developers:
                    remaining = max_hours - developer_hours[dev.id]
                    is_below_min = developer_task_count[dev.id] < min_tasks

                    if task.estimated_effort <= remaining or is_below_min:
                        assignments[task.id] = dev.id
                        developer_hours[dev.id] += task.estimated_effort
                        developer_task_count[dev.id] += 1
                        unassigned_tasks.remove(task)
                        break


        # Create detailed assignment information
        assignment_details = []
        developer_dict = {dev.id: dev for dev in developers}
        
        # Check fairness achievement
        below_min_devs = [dev_id for dev_id, count in developer_task_count.items() if count < min_tasks]
        above_max_devs = [dev_id for dev_id, count in developer_task_count.items() if count > max_tasks]
        
        if below_min_devs:
            logger.warning(f"{len(below_min_devs)} developers still below minimum task threshold")
        if above_max_devs:
            logger.warning(f"{len(above_max_devs)} developers above maximum task threshold")
        
        # Log workload distribution
        logger.info("Task distribution per developer:")
        for dev_id, count in developer_task_count.items():
            dev_email = developer_dict[dev_id].email if dev_id in developer_dict else 'Unknown'
            logger.info(f"  {dev_email}: {count} tasks, {developer_hours[dev_id]:.1f} hours")
        
        # Create assignment details for response
        for task in sorted_tasks:
            dev_id = assignments.get(task.id)
            if dev_id:
                score = self.calculate_task_score(
                    task, dev_id, performance_data, rework_data, 
                    emotion_data, developer_hours[dev_id] - task.estimated_effort  # Hours before this task
                )
                
                assignment_details.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': developer_dict[dev_id].email,
                    'developer_id': dev_id,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'estimated_effort': task.estimated_effort,
                    'score': float(score) if isinstance(score, (int, float)) and score != float('-inf') and score != float('inf') and not (isinstance(score, float) and math.isnan(score)) else None
                })
                
                # Update the actual task in the database
                task.user = developer_dict[dev_id]
                task.save()
            else:
                assignment_details.append({
                    'task_id': task.id,
                    'task_name': task.task_name,
                    'developer': None,
                    'developer_id': None,
                    'category': task.task_category,
                    'complexity': task.task_complexity,
                    'estimated_effort': task.estimated_effort,
                    'score': None
                })
                
                logger.warning(f"Could not assign task {task.id} ({task.task_name}) to any developer")
        
        return assignment_details
    
    def assign_tasks(self, project, sprint):
        """
        Assign unassigned tasks in the sprint to developers using CSP with fairness constraints.
        Returns a list of assignments for logging/response.
        """
        logger.info(f"Starting task assignment for project '{project.name}', sprint '{sprint.sprint_name}'")
        
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
        
        # Run CSP assignment algorithm with fairness constraints
        assignments = self.csp_assignment_with_fairness(
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
        
        try:
            # Perform task assignments
            assignments = self.assign_tasks(project, sprint)
            
            if not assignments:
                logger.info("No tasks assigned (no unassigned tasks or developers available)")
                return Response(
                    {"message": "No tasks were assigned (no unassigned tasks or developers available)"},
                    status=status.HTTP_200_OK
                )
            
            # Clean the assignments data to ensure JSON serialization works
            # This removes any non-JSON-serializable values (inf, -inf, NaN)
            safe_assignments = []
            for assignment in assignments:
                safe_assignment = {}
                for key, value in assignment.items():
                    if key == 'score' and (value == float('inf') or value == float('-inf') or
                                        (isinstance(value, float) and math.isnan(value))):
                        safe_assignment[key] = None
                    else:
                        safe_assignment[key] = value
                safe_assignments.append(safe_assignment)
            
            # Group assignments by developer for summary
            dev_assignments = {}
            for a in safe_assignments:
                if a['developer']:
                    if a['developer'] not in dev_assignments:
                        dev_assignments[a['developer']] = []
                    dev_assignments[a['developer']].append(a)
            
            # Create assignment summary
            assignment_summary = []
            for dev, tasks in dev_assignments.items():
                hours = sum(t['estimated_effort'] for t in tasks if t['estimated_effort'])
                assignment_summary.append({
                    'developer': dev,
                    'task_count': len(tasks),
                    'total_hours': hours
                })
            
            assigned_count = sum(1 for a in safe_assignments if a['developer'] is not None)
            logger.info(f"Request completed: assigned {assigned_count} of {len(safe_assignments)} tasks")
            return Response(
                {
                    "message": f"Assigned {assigned_count} of {len(safe_assignments)} tasks successfully",
                    "summary": assignment_summary,
                    "assignments": safe_assignments
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            # Log the exception
            logger.error(f"Error during task assignment: {str(e)}", exc_info=True)
            return Response(
                {"error": "An error occurred during task assignment", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )