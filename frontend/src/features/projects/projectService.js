import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/projects/";

// Fetch all projects
const getProjects = async () => {
    try {
    const response = await axios.get(API_URL);
    return response.data;
    } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
    }
};

// Create a new project
const createProject = async (projectData) => {
    try {
    const response = await axios.post(API_URL, projectData);
    return response.data;
    } catch (error) {
    console.error("Error creating project:", error);
    throw error;
}
};

export { getProjects, createProject };
