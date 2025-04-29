from developer_performance.models import DeveloperPerformance
from tasks.models import Task
from .models import ProjectUsers
from django.db.models import Sum

def calculate_rewards_for_sprint(project_id, sprint_id):
    users_in_project = ProjectUsers.objects.filter(project_id=project_id)

    for project_user in users_in_project:
        user = project_user.user

        # Productivity for this sprint
        performances = DeveloperPerformance.objects.filter(
            user=user,
            project_id=project_id,
            sprint_id=sprint_id
        )

        total_productivity = sum([p.productivity for p in performances])
        total_tasks = sum([p.total_tasks for p in performances])
        avg_productivity = total_productivity / total_tasks if total_tasks > 0 else 0

        # Rework for this sprint
        rework = Task.objects.filter(
            project_id=project_id,
            sprint_id=sprint_id,
            user=user
        ).aggregate(total=Sum('rework_effort'))['total'] or 0

        # Reward logic
        base_points = 5
        bonus = total_productivity
        penalty = int(rework)

        points = max(0, base_points + bonus - penalty)

        # Update ProjectUser model
        project_user.points += points
        project_user.save()

        # Optional badges
        if avg_productivity >= 2.0 and rework == 0:
            project_user.add_badge("🏆 Top Performer")
        elif avg_productivity >= 1.5:
            project_user.add_badge("💪 Consistent")
        elif rework == 0:
            project_user.add_badge("🧼 No Rework")
