import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/v1/sprints/sprints/";

const config = {
  headers: {
    "Content-type": "application/json",
  },
};

// Fetch all sprints
const fetchSprints = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Add a new sprint
const addSprint = async (sprintData) => {
  const response = await axios.post(API_URL, sprintData, config);
  return response.data;
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
