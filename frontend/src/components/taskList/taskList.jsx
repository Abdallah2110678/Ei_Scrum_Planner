import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, clearTasks } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import TaskItem from "./TaskItem";
import CreateIssueButton from "../../components/taskButton/CreateTaskButton";
import "./TaskList.css";

const TaskList = ({ handleCreateSprint }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { sprints } = useSelector((state) => state.sprints);
  const { selectedProjectId } = useSelector((state) => state.projects);

  useEffect(() => {
    if (selectedProjectId) {
      console.log("🔄 Switching projects, clearing tasks first...");
      dispatch(clearTasks());  // ✅ Clear previous project’s tasks
      dispatch(fetchTasks(selectedProjectId));  // ✅ Fetch tasks for new project
      dispatch(fetchSprints());
    }
  }, [dispatch, selectedProjectId]);

  return (
    <div className="sprint-info">
      <strong>Backlog</strong>
      <div className="empty-backlog-message">
        {tasks.length === 0 ? (
          <div className="empty-backlog">
            <p>No tasks found for this project.</p>
          </div>
        ) : (
          <div className="task-list-container">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} sprints={sprints} selectedProjectId={selectedProjectId} />
            ))}
          </div>
        )}
        <div className="sprint-actions">
          <button className="create-sprint-button" onClick={handleCreateSprint}>
            Create Sprint
          </button>
        </div>
      </div>
      <CreateIssueButton />
    </div>
  );
};

export default TaskList;
