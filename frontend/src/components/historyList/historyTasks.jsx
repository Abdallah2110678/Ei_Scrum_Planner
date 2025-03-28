import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateTask, deleteTask, fetchTasks, predictStoryPoints } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";

const HistoryTasks = ({ task }) => {
    return (
        <div key={task.id} className="task-item">

            {/* Task Name (Read-Only) */}
            <div className="task-name-container">
                <span className="task-name">{task.task_name}</span>
            </div>

            {/* Story Points (Read-Only) */}
            <div className="story-points">
                <span className="story-points-text">{task.story_points}</span>
            </div>

            {/* User Avatar */}
            <div className="user-avatar">{task.user_initials || "ZM"}</div>

        </div>
    );
};

export default HistoryTasks;
