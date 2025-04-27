import axios from "axios";

const API_URLGET = "http://127.0.0.1:8000/api/projects/user/";
const API_URL_create = "http://127.0.0.1:8000/api/projects/create/";
const API_URL_PARTICIPANTS = "http://127.0.0.1:8000/projects/";

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

// Fetch all projects
const getProjects = async (userId) => {
  try {
    const response = await axios.get(`${API_URLGET}${userId}/`, config);
    if (!response.data.projects || !Array.isArray(response.data.projects)) {
      throw new Error("Invalid response format: Expected an array of projects.");
    }
    return response.data.projects;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || "Error fetching projects");
  }
};

// Create a new project
const createNewProject = async (projectData) => {
  try {
    const response = await axios.post(API_URL_create, projectData, config);
    return response.data.data; // Return the actual project data
  } catch (error) {
    console.error("🚨 Error creating project:", error.response?.data || error.message);
    // Throw a more descriptive error
    throw new Error(error.response?.data?.error || error.message || "Failed to create project");
  }
};

const getProjectParticipants = async (projectId) => {
  if (!projectId) {
    console.warn("⚠️ Tried to fetch participants without a project ID");
    return { project_name: "", users: [] };
  }

  const response = await axios.get(`${API_URL_PARTICIPANTS}${projectId}/users/`, config);
  return response.data;
};
const updateProject = async ({ id, projectData }) => {
  try {
    if (!id) {
      throw new Error("Project ID is required");
    }

    const response = await axios.patch(
      `http://127.0.0.1:8000/api/projects/${id}/`,
      projectData,
      config
    );

    if (!response.data) {
      throw new Error("No data received from server");
    }

    return response.data;
  } catch (error) {
    console.error(
      "Error updating project:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.error || error.message || "Failed to update project"
    );
  }
};


const projectService = {
  getProjects,
  createNewProject, // ✅ Renamed to prevent conflicts
  getProjectParticipants,
  updateProject,
};

export default projectService;
