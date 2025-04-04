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
            user_id = int(data["user_id"])
            task_id = int(data["task_id"])
            task_complexity = data["task_complexity"]  # Use Postman input
            task_category = data["task_category"]      # Use Postman input

            # Encode complexity from Postman input
            complexity_map = {"EASY": 1, "MEDIUM": 2, "HARD": 3}
            task_complexity_encoded = complexity_map.get(task_complexity.upper(), 2)

            # Predict effort
            predicted_effort = predict_effort(task_complexity_encoded, task_category, user_id, task_id)

            # Fetch task for response
            task = Task.objects.get(id=task_id)

            return JsonResponse({
                "predicted_effort": round(predicted_effort, 2),
                "task_name": task.task_name,
                "task_category": task_category,
                "task_complexity": task_complexity,
                "message": "Effort estimated successfully"
            })

        except KeyError as e:
            return JsonResponse({"error": f"Missing field: {str(e)}"}, status=400)
        except (User.DoesNotExist, Task.DoesNotExist):
            return JsonResponse({"error": "User or Task not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "POST method only"}, status=405)