from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from task_estimation.task_estimation import train_model, predict_effort
from developer_performance.models import DeveloperPerformance
from task_estimation.models import Task
from users.models import User

@csrf_exempt
def train_model_view(request):
    if request.method == "GET":
        try:
            best_algo, best_mae = train_model()
            return JsonResponse({
                "message": "Model trained successfully",
                "algorithm": best_algo,
                "mae": best_mae
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "GET method only"}, status=405)
@csrf_exempt
def predict_task_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = int(data["user_id"])  # Validate as integer
            task_id = int(data["task_id"])  # Validate as integer

            task = Task.objects.get(id=task_id)

            # Encode complexity
            complexity_map = {"EASY": 1, "MEDIUM": 2, "HARD": 3}
            task_complexity = complexity_map.get(task.task_complexity.upper(), 2)

            # Get productivity
            perf = DeveloperPerformance.objects.get(
                user_id=user_id,
                category=task.task_category,
                complexity=task.task_complexity
            )
            productivity = perf.productivity or 1.0

            # Predict effort
            predicted_effort = predict_effort(task_complexity, productivity, user_id, task_id)

            return JsonResponse({
                "predicted_effort": round(predicted_effort, 2),
                "task_name": task.task_name,  # Fetch from Task
                "task_category": task.task_category,  # Fetch from Task
                "task_complexity": task.task_complexity,  # Fetch from Task
                "productivity": productivity,
                "message": "Effort estimated successfully"
            })

        except KeyError as e:
            return JsonResponse({"error": f"Missing field: {str(e)}"}, status=400)
        except (User.DoesNotExist, Task.DoesNotExist, DeveloperPerformance.DoesNotExist):
            return JsonResponse({"error": "User, Task, or DeveloperPerformance not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "POST method only"}, status=405)