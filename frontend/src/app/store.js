import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../features/auth/authSlice"
import taskReducer from "../features/tasks/taskSlice"
import sprintReducer from "../features/sprints/sprintSlice"
export const store = configureStore({
    reducer: {
        auth: authReducer,
        tasks: taskReducer,
        sprints: sprintReducer,
    },
})