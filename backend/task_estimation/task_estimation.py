import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor
from sklearn.neural_network import MLPRegressor
from xgboost import XGBRegressor
from task_estimation.models import Estimation, Task
from users.models import User
from developer_performance.models import DeveloperPerformance

MODEL_PATH = "best_effort_model.pkl"
BEST_ALGO_PATH = "best_effort_algo.txt"

def train_model():
    # Load task data with user info
    tasks = Task.objects.select_related("user").values(
        "id", "user_id", "task_complexity", "task_category", "effort"
    )
    df = pd.DataFrame(tasks)

    if df.empty:
        raise ValueError("No task data found for training.")

    # Add productivity
    productivity_list = []
    for _, row in df.iterrows():
        try:
            perf = DeveloperPerformance.objects.get(
                user_id=row["user_id"],
                category=row["task_category"],
                complexity=row["task_complexity"]
            )
            productivity_list.append(perf.productivity)
        except DeveloperPerformance.DoesNotExist:
            productivity_list.append(1.0)  # default fallback

    df["productivity"] = productivity_list

    # Encode task complexity into numbers
    complexity_map = {"EASY": 1, "MEDIUM": 2, "HARD": 3}
    df["task_complexity"] = df["task_complexity"].map(complexity_map)

    # Features and target
    X = df[["task_complexity", "productivity"]]
    y = df["effort"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # ML Models
    models = {
        "RandomForest": RandomForestRegressor(random_state=42),
        "LinearRegression": LinearRegression(),
        "DecisionTree": DecisionTreeRegressor(random_state=42),
        "SVR": SVR(kernel='linear'),
        "KNeighbors": KNeighborsRegressor(n_neighbors=3),
        "GradientBoosting": GradientBoostingRegressor(random_state=42),
        "XGBoost": XGBRegressor(objective="reg:squarederror", random_state=42),
        "ExtraTrees": ExtraTreesRegressor(random_state=42),
        "MLPRegressor": MLPRegressor(hidden_layer_sizes=(100,), max_iter=1000, random_state=42)
    }

    best_model, best_mae, best_algo = None, float("inf"), None

    for name, model in models.items():
        model.fit(X_train, y_train)
        mae = mean_absolute_error(y_test, model.predict(X_test))
        if mae < best_mae:
            best_mae = mae
            best_model = model
            best_algo = name

    # Save best model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)
    with open(BEST_ALGO_PATH, "w") as f:
        f.write(best_algo)

    return best_algo, best_mae


def predict_effort(task_complexity, productivity, user_id, task_id):
    if not os.path.exists(MODEL_PATH):
        train_model()

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    input_df = pd.DataFrame([[task_complexity, productivity]], columns=["task_complexity", "productivity"])
    predicted_effort = model.predict(input_df)[0]

    # Save to Estimation model
    task = Task.objects.get(id=task_id)
    user = User.objects.get(id=user_id)
    estimation, _ = Estimation.objects.get_or_create(user=user, task=task)

    estimation.estimated_effort = predicted_effort
    estimation.productivity = productivity
    estimation.save()

    return predicted_effort