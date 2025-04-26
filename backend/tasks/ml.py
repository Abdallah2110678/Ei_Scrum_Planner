import pandas as pd  # type: ignore
import pickle
import os
import warnings
from sklearn.exceptions import ConvergenceWarning  # type: ignore
from sklearn.model_selection import train_test_split  # type: ignore
from sklearn.metrics import mean_absolute_percentage_error  # type: ignore
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor  # type: ignore
from sklearn.linear_model import LinearRegression  # type: ignore
from sklearn.tree import DecisionTreeRegressor  # type: ignore
from sklearn.svm import SVR  # type: ignore
from sklearn.neighbors import KNeighborsRegressor  # type: ignore
from sklearn.neural_network import MLPRegressor  # type: ignore
from xgboost import XGBRegressor  # type: ignore
from .models import Task

warnings.filterwarnings("ignore", category=ConvergenceWarning)

MODEL_PATH = "best_effort_model.pkl"
BEST_ALGO_PATH = "best_effort_algo.txt"

def train_model(project_id):
    tasks = Task.objects.filter(project_id=project_id).values("task_complexity", "task_category", "actual_effort")
    df = pd.DataFrame(tasks)

    if df.empty:
        raise ValueError(f"No task data found for training in project ID {project_id}.")

    df = df.dropna(subset=["actual_effort", "task_complexity", "task_category"])
    if df.empty:
        raise ValueError("All task records have missing or invalid values.")

    print(f"📦 Training on {len(df)} tasks for project ID {project_id}")

    complexity_map = {"EASY": 1, "MEDIUM": 2, "HARD": 3}
    df["task_complexity"] = df["task_complexity"].map(complexity_map)
    df = pd.get_dummies(df, columns=["task_category"], drop_first=True)

    feature_cols = ["task_complexity"] + [col for col in df.columns if "task_category" in col]
    X = df[feature_cols]
    y = df["actual_effort"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

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

    best_model, best_mape, best_algo = None, float("inf"), None

    print(f"\n📊 Model Evaluation for Project {project_id}:")
    for name, model in models.items():
        model.fit(X_train, y_train)
        mape = mean_absolute_percentage_error(y_test, model.predict(X_test)) * 100
        accuracy = 100 - mape
        print(f"{name}: Accuracy = {accuracy:.2f}% (MAPE = {mape:.2f}%)")
        if mape < best_mape:
            best_mape = mape
            best_model = model
            best_algo = name

    model_path = f"best_effort_model_{project_id}.pkl"
    algo_path = f"best_effort_algo_{project_id}.txt"
    mape_path = f"best_effort_mape_{project_id}.txt"

    with open(model_path, "wb") as f:
        pickle.dump(best_model, f)
    with open(algo_path, "w") as f:
        f.write(best_algo)
    with open(mape_path, "w") as f:
        f.write(str(best_mape))

    print(f"\n✅ Best Model for Project {project_id}: {best_algo} with Accuracy = {100 - best_mape:.2f}% (MAPE = {best_mape:.2f}%)")
    return best_algo, best_mape

def predict_effort(project_id, task_complexity, task_category, sprint_id=None):
    import pickle
    from .models import Task

    model_path = f"best_effort_model_{project_id}.pkl"
    mape_path = f"best_effort_mape_{project_id}.txt"
    sprint_path = f"last_trained_sprint_{project_id}.txt"
    task_count_path = f"last_trained_task_count_{project_id}.txt"

    retrain = False
    current_task_count = Task.objects.filter(project_id=project_id).count()

    # Load last sprint ID
    last_sprint_id = None
    if os.path.exists(sprint_path):
        with open(sprint_path, "r") as f:
            last_sprint_id = f.read().strip()

    # Load last task count
    last_task_count = None
    if os.path.exists(task_count_path):
        with open(task_count_path, "r") as f:
            try:
                last_task_count = int(f.read().strip())
            except ValueError:
                last_task_count = None

    # Check for significant task count change
    task_count_changed = (
        last_task_count is None or abs(current_task_count - last_task_count) >= 100
    )

    # Determine if retraining is needed
    if (
        not os.path.exists(model_path)
        or not os.path.exists(mape_path)
        or (sprint_id is not None and str(sprint_id) != last_sprint_id)
        or task_count_changed
    ):
        retrain = True

    if retrain:
        print(f"\n⚙️ Retraining model for project {project_id} (reason: {'new sprint' if str(sprint_id) != last_sprint_id else 'task count changed' if task_count_changed else 'missing model'}).")
        train_model(project_id)

        if sprint_id is not None:
            with open(sprint_path, "w") as f:
                f.write(str(sprint_id))

        with open(task_count_path, "w") as f:
            f.write(str(current_task_count))

    # Load trained model
    with open(model_path, "rb") as f:
        model = pickle.load(f)

    expected_features = model.feature_names_in_.tolist()
    complexity_map = {"EASY": 1, "MEDIUM": 2, "HARD": 3}
    task_complexity_encoded = complexity_map.get(task_complexity.upper(), 2)

    task_category_encoded = pd.get_dummies(pd.Series([task_category]), prefix="task_category", drop_first=True)

    input_df = pd.DataFrame(columns=expected_features)
    input_df.loc[0] = 0
    input_df["task_complexity"] = task_complexity_encoded

    for col in task_category_encoded.columns:
        if col in expected_features:
            input_df[col] = task_category_encoded[col].iloc[0]

    prediction = model.predict(input_df)[0]
    print(f"\n🔮 Prediction done for project {project_id} using model: {type(model).__name__}")
    return prediction
