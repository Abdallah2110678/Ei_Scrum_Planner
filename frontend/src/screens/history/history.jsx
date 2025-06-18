import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import "./history.css";
import HistoryTasks from "../../components/historyList/historyTasks";
import UserAvatars from '../../components/userAvatars/UserAvatars';

const History = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const { selectedProjectId, projects } = useSelector((state) => state.projects);


  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchSprints());
    }
  }, [dispatch, selectedProjectId]);

  // Filter sprints that are either completed or have done tasks
  const getFilteredSprints = () => {
    let filteredSprints = sprints.filter(
      (sprint) =>
        sprint.project === selectedProjectId &&
        (sprint.is_completed || sprint.tasks?.some(task => task.status === "DONE"))
    );

    // Filter by search query
    if (searchQuery) {
      filteredSprints = filteredSprints.map(sprint => ({
        ...sprint,
        tasks: sprint.tasks?.filter(task =>
          task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(sprint => sprint.tasks?.length > 0);
    }

    // Filter by selected user
    if (selectedUserId) {
      filteredSprints = filteredSprints.map(sprint => ({
        ...sprint,
        tasks: sprint.tasks?.filter(task => task.user === selectedUserId)
      })).filter(sprint => sprint.tasks?.length > 0);
    }

    return filteredSprints;
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="history-container">
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Project</a>
        <span className="separator"> / </span>
        <span className="school-link">
          {selectedProjectId
            ? projects.find(p => p.id === selectedProjectId)?.name || "Unnamed Project"
            : "No Project Selected"}
        </span>
      </div>


      <h2>Completed Sprints & Tasks</h2>

      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <UserAvatars
            onUserSelect={handleUserSelect}
            selectedUserId={selectedUserId}
          />
        </div>
      </div>

      {!selectedProjectId ? (
        <p className="no-project-message">Please select a project to view its history.</p>
      ) : getFilteredSprints().length === 0 ? (
        <p className="no-sprints-message">No completed sprints or tasks yet.</p>
      ) : (
        getFilteredSprints().map((sprint) => (
          <div key={sprint.id} className="sprint-info">
            <strong>{sprint.sprint_name}</strong>
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
              <p className="no-tasks-message">No completed tasks in this sprint.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default History;