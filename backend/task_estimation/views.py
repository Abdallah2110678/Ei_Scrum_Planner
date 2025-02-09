from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from task_estimation.task_estimation import train_model, predict_story_points
from task_estimation.models import Task

@csrf_exempt
def train_model_view(request):
    if request.method == "GET":
        try:
            train_model()
            return JsonResponse({"message": "Model trained successfully!"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method. Only GET is allowed."}, status=405)


@csrf_exempt
def insert_task_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            Task.objects.create(
                developer_name=data["developer_name"],
                developer_experience=data["developer_experience"],
                task_name=data["task_name"],
                task_duration=data["task_duration"],
                task_complexity=data["task_complexity"],
                story_points=data["story_points"],
            )
            return JsonResponse({"message": "Task inserted successfully!"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method."}, status=405)


@csrf_exempt
def predict_task_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            developer_experience = int(data["developer_experience"])
            task_duration = float(data["task_duration"])
            task_complexity = int(data["task_complexity"])
            predicted_story_points = predict_story_points(developer_experience, task_duration, task_complexity)
            return JsonResponse({
                "predicted_story_points": predicted_story_points,
                "message": "Prediction successful!"
            }, status=200)
        except Exception as e:
            # Log and return any error
            print("Error:", str(e))
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method. Only POST is allowed."}, status=405)