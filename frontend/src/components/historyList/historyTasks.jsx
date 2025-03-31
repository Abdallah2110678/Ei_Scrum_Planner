import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateTask } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import "./historyTasks.css";

const HistoryTasks = ({ task, sprint }) => {
    const dispatch = useDispatch();

    // Show task if either the sprint is completed OR the task status is "DONE"
    if (!sprint.is_completed && task.status !== "DONE") {
        return null;
    }

    const handleReactivateTask = async () => {
        try {
            await dispatch(updateTask({
                id: task.id,
                taskData: {
                    ...task,
                    status: "TO DO",
                    sprint: sprint.id
                }
            })).unwrap();
            await dispatch(fetchSprints());
        } catch (error) {
            console.error("Failed to reactivate task:", error);
        }
    };

    return (
        <div key={task.id} className="history-task-item">
            {/* Task Name */}
            <div className="history-task-name-container">
                <span className="history-task-name">{task.task_name}</span>
            </div>

            {/* Task Complexity Dropdown (Disabled) */}
            <select
                className="task-complexity-select"
                value={task.task_complexity}
                disabled
            >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
            </select>

            {/* Task Category Dropdown (Disabled) */}
            <select
                className="task-category-select"
                value={task.task_category}
                disabled
            >
                <option value="FE">Frontend</option>
                <option value="BE">Backend</option>
                <option value="REWORK">Rework</option>
                <option value="DEVOPS">DevOps</option>
                <option value="TESTING">Testing</option>
            </select>

            {/* Priority Input (Disabled) */}
            <input
                type="number"
                className="priority-input"
                value={task.priority}
                min="1"
                max="5"
                disabled
            />

            {/* Status Dropdown (Disabled) */}
            <select
                className="task-status"
                value={task.status}
                disabled
            >
                <option value="TO DO">To Do</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
            </select>

            {/* User Avatar and Active Button */}
            <div className="history-avatar-container">
                <div className="user-avatar">
                    {task.user_initials || "ZM"}
                </div>
            </div>

            {/* Active Button */}
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