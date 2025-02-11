from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from users.models import User
from task_estimation.task_estimation import train_model, predict_story_points
from task_estimation.models import Task

@csrf_exempt
def train_model_view(request):
    if request.method == "GET":
        try:
            train_model()  # Call the function; results are printed in the console
            return JsonResponse({"message": "Model trained successfully!"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method. Only GET is allowed."}, status=405)
@csrf_exempt
def predict_task_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            # Retrieve user experience
            user = User.objects.get(id=data["user_id"])
            developer_experience = user.experience

            task_duration = float(data["task_duration"])
            task_complexity = int(data["task_complexity"])
            task_id = data["task_id"]  # Ensure task_id is included in request

            # Predict story points
            predicted_story_points = predict_story_points(
                developer_experience, task_duration, task_complexity, data["user_id"], task_id
            )

            return JsonResponse({
                "predicted_story_points": predicted_story_points,
                "message": "Prediction successful!"
            }, status=200)

        except KeyError as e:
            return JsonResponse({"error": f"Missing field: {str(e)}"}, status=400)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found!"}, status=404)
        except Task.DoesNotExist:
            return JsonResponse({"error": "Task not found!"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method. Only POST is allowed."}, status=405)
