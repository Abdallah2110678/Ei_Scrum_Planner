import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor
import pickle
import os

MODEL_PATH = "best_model.pkl"

def train_model():
    # Fetch data from the database
    from task_estimation.models import Task
    tasks = Task.objects.all().values(
        "developer_experience", "task_duration", "task_complexity", "story_points"
    )
    df = pd.DataFrame(tasks)

    if df.empty:
        raise ValueError("No data available for training.")

    # Prepare features and target
    X = df[["developer_experience", "task_duration", "task_complexity"]]
    y = df["story_points"]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Define algorithms to evaluate
    algorithms = {
        "RandomForest": RandomForestRegressor(random_state=42),
        "LinearRegression": LinearRegression(),
        "DecisionTree": DecisionTreeRegressor(random_state=42),
        "SVR": SVR(kernel='linear'),
        "KNeighbors": KNeighborsRegressor(n_neighbors=3)
    }

    # Evaluate each algorithm
    best_model = None
    best_mae = float("inf")
    results = {}

    print("\nAlgorithm Performance:")
    print("-" * 30)

    for name, model in algorithms.items():
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        mae = mean_absolute_error(y_test, predictions)
        results[name] = mae

        # Print MAE for the algorithm
        print(f"{name}: MAE = {mae:.4f}")

        # Save the best model
        if mae < best_mae:
            best_mae = mae
            best_model = model

    print("\nBest Model:")
    print(f"{best_model} with MAE = {best_mae:.4f}")

    # Save the best model to a file
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)

    return results
def predict_story_points(developer_experience, task_duration, task_complexity):

    MODEL_PATH = "best_model.pkl"

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Trained model not found. Please train the model first.")

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    features = [[developer_experience, task_duration, task_complexity]]
    predicted_story_points = model.predict(features)

    return predicted_story_points[0]
