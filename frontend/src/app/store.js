import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import taskReducer from "../features/tasks/taskSlice";
import projectReducer from "../features/projects/projectSlice"; // ✅ Ensure correct import
import sprintReducer from "../features/sprints/sprintSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    sprints: sprintReducer,
    projects: projectReducer, // ✅ Correct key (not "project")
  },
});
