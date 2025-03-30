import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateTask, deleteTask, fetchTasks, predictStoryPoints } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import "../taskList/taskList.css"; // Import the taskList styles directly

const HistoryTasks = ({ task, sprint }) => {
    // Show task if either the sprint is completed OR the task status is "DONE"
    if (!sprint.is_completed && task.status !== "DONE") {
        return null;
    }

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

            
        </div>
    );
};

export default HistoryTasks;