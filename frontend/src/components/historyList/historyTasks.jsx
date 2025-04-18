import { useDispatch, useSelector } from "react-redux";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import { updateTask } from "../../features/tasks/taskSlice";
import "./historyTasks.css";

const HistoryTasks = ({ task, sprint }) => {
    const dispatch = useDispatch();
    const { developers } = useSelector((state) => state.projects);

    // Show task if either the sprint is completed OR the task status is "DONE"
    if (!sprint.is_completed && task.status !== "DONE") {
        return null;
    }

    // Function to get initials from a name
    const getInitials = (name) => {
        if (!name) return "N/A";
        const nameParts = name.split(" ");
        return nameParts.length > 1
            ? `${nameParts[0][0]}${nameParts[1][0]}`
            : nameParts[0][0] || "N/A";
    };

    // Get assigned user info
    const assignedUser = developers?.users?.find(dev => dev.id === task.user);
    const userInitials = assignedUser ? getInitials(assignedUser.name) : "N/A";

    const handleReactivateTask = async () => {
        try {
            await dispatch(updateTask({
                id: task.id,
                taskData: {
                    ...task,
                    status: "TO DO",
                    sprint: sprint.is_completed ? null : task.sprint  // Keep sprint assignment if sprint is not completed
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

            {/* Task Category Input (Disabled) */}
            <input
                type="text"
                className="task-category-input"
                value={task.task_category}
                disabled
            />

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

            {/* User Avatar with Name */}
            <div className="history-avatar-container">
                <div
                    className="user-avatar"
                    title={assignedUser ? assignedUser.name : "Unassigned"}
                >
                    {userInitials}
                </div>
            </div>

            {/* Actual Effort Input (Disabled) */}
            <input
                type="number"
                className="effort-input"
                value={task.actual_effort || 0}
                disabled
            />

            {/* Estimated Effort Display */}
            <div className="estimated-effort-display">
                {task.estimated_effort != null ? `${task.estimated_effort.toFixed(1)} hrs` : "N/A"}
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