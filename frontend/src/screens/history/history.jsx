import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import "./History.css";
import HistoryTasks from "../../components/historyList/historyTasks";

const History = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const selectedProjectId = useSelector((state) => state.projects.selectedProjectId);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchSprints());
    }
  }, [dispatch, selectedProjectId]);

  // Filter sprints that are either completed or have done tasks
  const relevantSprints = sprints.filter(
    (sprint) => 
      sprint.project === selectedProjectId && 
      (sprint.is_completed || sprint.tasks?.some(task => task.status === "DONE"))
  );

  return (
    <div className="history-container">
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Projects</a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">School</a>
      </div>

      <h2>Completed Sprints & Tasks</h2>

      {!selectedProjectId ? (
        <p>Please select a project to view its history.</p>
      ) : relevantSprints.length === 0 ? (
        <p>No completed sprints or tasks yet.</p>
      ) : (
        relevantSprints.map((sprint) => (
          <div key={sprint.id} className="sprint-history">
            <h3>{sprint.sprint_name}</h3>
            <div className="sprint-details">
              {sprint.is_completed && (
                <p>Sprint completed on: {new Date(sprint.end_date).toLocaleDateString()}</p>
              )}
              {sprint.sprint_goal && <p>Goal: {sprint.sprint_goal}</p>}
            </div>
            {sprint.tasks && sprint.tasks.length > 0 ? (
              <div className="tasks-list">
                {sprint.tasks.map((task) => (
                  <HistoryTasks 
                    key={task.id} 
                    task={task} 
                    sprint={sprint}
                  />
                ))}
              </div>
            ) : (
              <p>No completed tasks in this sprint.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default History;