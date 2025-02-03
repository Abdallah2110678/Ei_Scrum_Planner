import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import TaskItem from "./taskItem";
import "./taskList.css";

const TaskList = ({ handleCreateSprint }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { sprints } = useSelector((state) => state.sprints);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchSprints());
  }, [dispatch]);

  return (
    <div className="sprint-info">
      <strong>Backlog</strong>
      <div className="empty-backlog-message">
        <div className="empty-backlog">
          {tasks.length === 0 ? (
            <p>Your backlog is empty.</p>
          ) : (
            <div className="task-list-container">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} sprints={sprints} />
              ))}
            </div>
          )}
          <div className="sprint-actions">
            <button className="create-sprint-button" onClick={handleCreateSprint}>Create sprint</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;
