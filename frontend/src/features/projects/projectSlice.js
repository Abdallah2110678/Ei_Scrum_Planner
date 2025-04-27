import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import projectService from "./projectService";

// Fetch all projects
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (userId, thunkAPI) => {
    try {
      return await projectService.getProjects(userId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch projects"
      );
    }
  }
);

// Create a new project
export const createNewProject = createAsyncThunk(
  "projects/createProject",
  async (projectData, thunkAPI) => {
    try {
      return await projectService.createNewProject(projectData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to create project"
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, projectData }, thunkAPI) => {
    try {
      return await projectService.updateProject({ id, projectData });
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to update project"
      );
    }
  }
);

export const fetchProjectParticipants = createAsyncThunk(
  "projects/fetchProjectParticipants",
  async (projectId, thunkAPI) => {
    try {
      return await projectService.getProjectParticipants(projectId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch participants"
      );
    }
  }
);

// Safely parse selectedProjectId from localStorage
const storedProjectId = localStorage.getItem("selectedProjectId");
let selectedProjectId = null;
if (storedProjectId) {
  try {
    selectedProjectId = JSON.parse(storedProjectId);
  } catch (error) {
    console.error("Failed to parse storedProjectId:", error);
    selectedProjectId = null; // Fallback to null if parsing fails
  }
}

const initialState = {
  projects: [],
  selectedProjectId: selectedProjectId || null,
  participants: null,
  developers: null,
  isLoading: false,
  isError: false,
  message: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    resetProjectState: (state) => {
      // Clear all project-related data
      state.selectedProjectId = null;
      state.participants = null;
      state.developers = null;
      state.isLoading = false;
      state.isError = false;
      state.message = null;
      // Don't clear projects array to maintain list
      // Clear localStorage
      localStorage.removeItem("selectedProjectId");
    },
    setSelectedProjectId: (state, action) => {
      const newProjectId = action.payload;

      // Validate the project ID
      if (
        newProjectId === null ||
        (typeof newProjectId === "number" && !isNaN(newProjectId))
      ) {
        // Reset related states first
        state.participants = null;
        state.developers = null;
        state.isError = false;
        state.message = null;

        // Set new project ID
        state.selectedProjectId = newProjectId;

        try {
          // Update localStorage
          if (newProjectId === null) {
            localStorage.removeItem("selectedProjectId");
          } else {
            localStorage.setItem(
              "selectedProjectId",
              JSON.stringify(newProjectId)
            );
          }
        } catch (error) {
          console.error("Failed to update localStorage:", error);
        }
      } else {
        console.error("Invalid project ID:", newProjectId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createNewProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.push(action.payload);
      })
      .addCase(createNewProject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchProjectParticipants.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjectParticipants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.participants = action.payload;
        const developers = action.payload.users.filter(
          (user) => user.role === "Developer"
        );
        state.developers = {
          project_name: action.payload.project_name,
          users: developers,
        };
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(fetchProjectParticipants.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { setSelectedProjectId, resetProjectState } = projectSlice.actions;
export default projectSlice.reducer;
