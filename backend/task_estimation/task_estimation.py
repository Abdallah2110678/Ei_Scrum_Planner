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

MODEL_PATH = "best_effort_model.pkl"
BEST_ALGO_PATH = "best_effort_algo.txt"

def train_model():
    # Load task data with only the fields we need
    tasks = Task.objects.values("task_complexity", "task_category", "effort")
    df = pd.DataFrame(tasks)

    if df.empty:
        raise ValueError("No task data found for training.")

    # Encode task complexity into numbers
    complexity_map = {"EASY": 1, "MEDIUM": 2, "HARD": 3}
    df["task_complexity"] = df["task_complexity"].map(complexity_map)

    # One-hot encode task_category
    df = pd.get_dummies(df, columns=["task_category"], drop_first=True)

    # Define features explicitly
    feature_cols = ["task_complexity"] + [col for col in df.columns if "task_category" in col]
    X = df[feature_cols]
    y = df["effort"]

    # Print features for verification
    print("Training features:", X.columns.tolist())

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

    # Save best model with confirmation
    print("Saving model to:", MODEL_PATH)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)
    with open(BEST_ALGO_PATH, "w") as f:
        f.write(best_algo)
    print("Model saved successfully")

    return best_algo, best_mae
def predict_effort(task_complexity, task_category, user_id, task_id):
    if not os.path.exists(MODEL_PATH):
        print("Model not found, training new model...")
        train_model()

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    # Get the model's expected feature names
    expected_features = model.feature_names_in_.tolist()

    # task_complexity is already an integer (1, 2, 3)
    task_complexity_encoded = task_complexity

    # One-hot encode task_category
    task_category_encoded = pd.get_dummies(pd.Series([task_category]), prefix="task_category", drop_first=True)

    # Create a DataFrame with all expected features, initialized to 0
    input_df = pd.DataFrame(columns=expected_features)
    input_df.loc[0] = 0  # Fill with zeros

    # Set task_complexity
    input_df["task_complexity"] = task_complexity_encoded

    # Update with the provided task_category columns
    for col in task_category_encoded.columns:
        if col in expected_features:
            input_df[col] = task_category_encoded[col].iloc[0]

    # Predict effort
    predicted_effort = model.predict(input_df)[0]

    # Save to Estimation model
    task = Task.objects.get(id=task_id)
    user = User.objects.get(id=user_id)
    estimation, _ = Estimation.objects.get_or_create(user=user, task=task)
    estimation.estimated_effort = predicted_effort
    estimation.save()

    return predicted_effort