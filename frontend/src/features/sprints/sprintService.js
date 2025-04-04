import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/v1/sprints/";

const config = {
  headers: {
    "Content-type": "application/json",
  },
};

// Fetch all sprints
const fetchSprints = async (projectId) => {
  const response = await axios.get(`${API_URL}?project=${projectId}`);
  return response.data;
};

// Add a new sprint
const addSprint = async (sprintData) => {
  try {
    const response = await axios.post(API_URL, {
      sprint_name: sprintData.sprint_name,
      project: sprintData.project,  // ✅ FIXED: Use "project" instead of "project_id"
      is_active: false,
      is_completed: false,
      tasks: []
    }, config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create sprint");
  }
};


// Update a sprint
const updateSprint = async ({ id, sprintData }) => {
  const response = await axios.patch(`${API_URL}${id}/`, sprintData, config);
  return response.data;
};

// Delete a sprint
const deleteSprint = async (id) => {
  await axios.delete(`${API_URL}${id}/`);
  return id;
};

// Export all service functions
const sprintService = {
  fetchSprints,
  addSprint,
  updateSprint,
  deleteSprint,
};

export default sprintService;
