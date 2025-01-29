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
BEST_ALGO_PATH = "best_model_algo.txt"

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
    best_algo = None
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
            best_algo = name

    print("\nBest Model:")
    print(f"{best_algo} with MAE = {best_mae:.4f}")

    # Save the best model and algorithm name to a file
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)

    with open(BEST_ALGO_PATH, "w") as f:
        f.write(best_algo)

    return results

def predict_story_points(developer_experience, task_duration, task_complexity):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Trained model not found. Please train the model first.")

    if not os.path.exists(BEST_ALGO_PATH):
        raise FileNotFoundError("Algorithm information not found. Please train the model first.")

    # Load the best model
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    # Load the best algorithm name
    with open(BEST_ALGO_PATH, "r") as f:
        best_algo = f.read()

    # Create a DataFrame for the input features
    feature_names = ["developer_experience", "task_duration", "task_complexity"]
    features = pd.DataFrame([[developer_experience, task_duration, task_complexity]], columns=feature_names)

    # Predict story points
    predicted_story_points = model.predict(features)

    # Print the algorithm used for prediction
    print(f"Prediction done using {best_algo} algorithm.")

    return predicted_story_points[0]
