from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from tasks.models import Task
from collections import defaultdict
from .models import DeveloperPerformance

def calculate_developer_productivity(request, user_id):
    tasks = Task.objects.filter(user_id=user_id, status="DONE")

    if not tasks.exists():
        return JsonResponse({"message": "No completed tasks found for this developer."}, status=404)

    grouped_effort = defaultdict(list)

    for task in tasks:
        key = task.task_category  # ✅ Only by category now
        grouped_effort[key].append(task.effort)

    results = {}
    for category, efforts in grouped_effort.items():
        total_effort = sum(efforts)
        avg_effort = total_effort / len(efforts)

        results[category] = {
            "total_tasks": len(efforts),
            "total_effort": total_effort,
            "avg_effort": round(avg_effort, 2)
        }

    return JsonResponse({
        "developer_id": user_id,
        "productivity_by_category": results
    })


def calculate_task_productivity(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
        return JsonResponse({
            "task_id": task.id,
            "developer_id": task.user.id if task.user else None,
            "category": task.task_category,
            "complexity": task.task_complexity,
            "actual_effort": task.effort,
        })
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)


def calculate_sprint_productivity(request, sprint_id):
    tasks = Task.objects.filter(sprint_id=sprint_id, status="DONE")

    if not tasks.exists():
        return JsonResponse({"message": "No completed tasks found for this sprint."}, status=404)

    from collections import defaultdict
    grouped_effort = defaultdict(list)

    for task in tasks:
        key = (task.task_category, task.task_complexity)
        grouped_effort[key].append(task.effort)

    results = {
        f"{cat} - {comp}": {
            "total_tasks": len(efforts),
            "total_effort": sum(efforts),
            "avg_effort": round(sum(efforts) / len(efforts), 2)
        }
        for (cat, comp), efforts in grouped_effort.items()
    }

    return JsonResponse({
        "sprint_id": sprint_id,
        "productivity_by_type": results
    })
