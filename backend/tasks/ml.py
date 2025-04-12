import pandas as pd  # type: ignore
import pickle
import os
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

MODEL_PATH = "best_effort_model.pkl"
BEST_ALGO_PATH = "best_effort_algo.txt"

def train_model():
    tasks = Task.objects.values("task_complexity", "task_category", "actual_effort")
    df = pd.DataFrame(tasks)

    if df.empty:
        raise ValueError("No task data found for training.")

    # Drop rows with missing values
    df = df.dropna(subset=["actual_effort", "task_complexity", "task_category"])

    if df.empty:
        raise ValueError("All task records have missing or invalid values.")

    # Encode complexity
    complexity_map = {"EASY": 1, "MEDIUM": 2, "HARD": 3}
    df["task_complexity"] = df["task_complexity"].map(complexity_map)

    # One-hot encode category
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

    print("\n Model Evaluation:")
    for name, model in models.items():
        model.fit(X_train, y_train)
        mape = mean_absolute_percentage_error(y_test, model.predict(X_test)) * 100
        accuracy = 100 - mape
        print(f"{name}: Accuracy = {accuracy:.2f}% (MAPE = {mape:.2f}%)")
        if mape < best_mape:
            best_mape = mape
            best_model = model
            best_algo = name

    # Save best model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)
    with open(BEST_ALGO_PATH, "w") as f:
        f.write(best_algo)

    print(f"\nBest Model: {best_algo} with Accuracy = {100 - best_mape:.2f}% (MAPE = {best_mape:.2f}%)")
    return best_algo, best_mape


def predict_effort(task_complexity, task_category):
    if not os.path.exists(MODEL_PATH):
        train_model()

    with open(MODEL_PATH, "rb") as f:
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
    print(f"\n🔮 Prediction done using model: {type(model).__name__}")
    return prediction
