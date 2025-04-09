import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/tasks/";

const config = {
  headers: {
    "Content-type": "application/json",
  },
};

// Fetch all tasks
const fetchTasks = async (selectedProjectId) => {
  try {
    if (!selectedProjectId) {
      console.log("No project ID provided");
      return [];
    }
    
    const url = `${API_URL}?project_id=${selectedProjectId}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error.response?.data || error.message);
    throw error;
  }
};

// Add a new task
const addTask = async (taskData) => {
  try {
    const response = await axios.post(API_URL, {  // Remove the extra /tasks/
      task_name: taskData.task_name,
      task_category: taskData.task_category || "FE",
      task_complexity: taskData.task_complexity || "MEDIUM",
      actual_effort: taskData.actual_effort || 1.0,
      priority: taskData.priority || 1,
      status: taskData.status || "TO DO",
      project: taskData.project,
      sprint: taskData.sprint || null,
      user: taskData.user || null
      
    }, config);
    console.log("Sending task data:", taskData); // Add logging
    return response.data;
  } catch (error) {
    console.error("Error in addTask:", error.response?.data || error.message);
    throw error;
  }
};

const predictStoryPoints = async (taskData) => {

  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/task-estimation/predict-task/",
      taskData,
      config
    );
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
