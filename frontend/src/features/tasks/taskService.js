import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/tasks/";

const config = {
  headers: {
    "Content-type": "application/json",
  },
};

// Fetch all tasks
const fetchTasks = async () => {
  const response = await axios.get(`${API_URL}?sprint=null`);
  return response.data;
};

// Add a new task
const addTask = async (taskData) => {
  const response = await axios.post(API_URL, taskData, config);
  return response.data;
};

const predictStoryPoints = async (taskData) => {
  console.log("🔍 Sending Request:", taskData);

  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/task-estimation/predict-task/",
      taskData,
      config
    );
    console.log("✅ Response:", response.data);
    return response.data.predicted_story_points;
  } catch (error) {
    console.error("❌ Error Response:", error.response?.data || error.message);
    throw error;
  }
};



// Update a task
const updateTask = async ({ id, taskData }) => {
  const response = await axios.patch(`${API_URL}${id}/`, taskData, config);
  return response.data;
};

// Delete a task
const deleteTask = async (id) => {
  await axios.delete(`${API_URL}${id}/`);
  return id;
};

// Export all service functions
const taskService = {
  fetchTasks,
  addTask,
  updateTask,
  deleteTask,
  predictStoryPoints,
};

export default taskService;
