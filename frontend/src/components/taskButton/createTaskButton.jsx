import { useState } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "../../features/tasks/taskSlice";
import "./createTaskButton.css";



const CreateIssueButton = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [taskName, setTaskName] = useState("");

    const dispatch = useDispatch();

    const handleClick = () => {
        setIsEditing(true);
    };

    const handleChange = (e) => {
        setTaskName(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && taskName.trim() !== "") {
            const taskData = {
                user_experience: 0,
                task_name: taskName,  // Use the updated taskName
                task_duration: 0,
                task_complexity: 0,
                story_points: 0,
            };

            dispatch(addTask(taskData));  // Dispatch correct task data
            setTaskName("");
            setIsEditing(false);
        }
    };

    return (
        <div className="create-issue-container">
            {isEditing ? (
                <input
                    type="text"
                    value={taskName}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    onBlur={() => setIsEditing(false)}
                    autoFocus
                    className="create-issue-input"
                    placeholder="Enter task name..."
                />
            ) : (
                <button className="create-issue-button" onClick={handleClick}>
                    <span className="plus-icon">+</span> Create issue
                </button>
            )}
        </div>
    );
};

export default CreateIssueButton;
