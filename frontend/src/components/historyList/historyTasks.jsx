import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateTask, deleteTask, fetchTasks, predictStoryPoints } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import "../taskList/taskList.css"; // Import the taskList styles directly

const HistoryTasks = ({ task, sprint }) => {
    const dispatch = useDispatch();

    // Show task if either the sprint is completed OR the task status is "DONE"
    if (!sprint.is_completed && task.status !== "DONE") {
        return null;
    }

    const handleReactivateTask = async () => {
        try {
            // Update task status to "TO DO" while keeping it in the same sprint
            await dispatch(updateTask({
                id: task.id,
                taskData: {
                    ...task,
                    status: "TO DO",
                    sprint: sprint.id  // Keep the task in its current sprint
                }
            })).unwrap();

            // Refresh the sprints to update the UI
            await dispatch(fetchSprints());
        } catch (error) {
            console.error("Failed to reactivate task:", error);
        }
    };

    return (
        <div key={task.id} className="task-item">
            {/* Task Name */}
            <div className="task-name-container">
                <span className="task-name">{task.task_name}</span>
            </div>

            {/* Story Points */}
            <div className="story-points">
                <span className="story-points-text">{task.story_points || 0}</span>
            </div>

            {/* Status */}
            <div className="task-status">
                <span>{task.status}</span>
            </div>

            {/* User Avatar */}
            <div className="user-avatar">{task.user_initials || "ZM"}</div>

            {/* Reactivate Button */}
            <button 
                className="reactivate-button"
                onClick={handleReactivateTask}
            >
                Active
            </button>
        </div>
    );
};

export default HistoryTasks;