import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/projects/";

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

// Fetch all projects
const getProjects = async () => {
  try {
    console.log("📡 Fetching projects from API...");
    const response = await axios.get(API_URL, config);

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format: Expected an array.");
    }

    console.log("✅ Projects Fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("🚨 Error fetching projects:", error.response?.data || error.message);
    return []; // Prevent UI crash
  }
};

// Create a new project
const createNewProject = async (projectData) => {
  try {
    console.log("📡 Creating project:", projectData);
    const response = await axios.post(API_URL, projectData, config);
    console.log("✅ Project Created:", response.data);
    return response.data;
  } catch (error) {
    console.error("🚨 Error creating project:", error.response?.data || error.message);
    throw error;
  }
};

const projectService = {
  getProjects,
  createNewProject, // ✅ Renamed to prevent conflicts
};

export default projectService;
