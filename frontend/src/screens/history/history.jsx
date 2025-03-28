import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import "./History.css";
import HistoryTasks from "../../components/historyList/historyTasks";

const History = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);

  useEffect(() => {
    dispatch(fetchSprints());
  }, [dispatch]);

  const completedSprints = sprints.filter((sprint) => sprint.is_completed);

  return (
    <div className="history-container">
      <h2>Completed Sprints & Tasks</h2>

      {completedSprints.length === 0 ? (
        <p>No completed sprints yet.</p>
      ) : (
        completedSprints.map((sprint) => (
          <div key={sprint.id} className="sprint-history">
            <h3>{sprint.sprint_name}</h3>
            {sprint.tasks.length === 0 ? (
              <p>No tasks in this sprint.</p>
            ) : (
              <div className="tasks-list">
                {sprint.tasks.map((task) => (
                  <HistoryTasks key={task.id} task={task} sprints={sprints} />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default History;
