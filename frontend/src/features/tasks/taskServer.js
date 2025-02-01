import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/tasks/";




// Fetch all tasks
const fetchTasks = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Add a new task
const addTask = async (taskData) => {
    const response = await axios.post(API_URL, taskData);
    return response.data;
};

// Update a task
const updateTask = async ({ id, taskData }) => {
    const response = await axios.put(`${API_URL}${id}/`, taskData);
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
};

export default taskService;
