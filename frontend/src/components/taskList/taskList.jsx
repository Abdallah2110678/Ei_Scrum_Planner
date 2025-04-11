import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, clearTasks } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import TaskItem from "./taskItem";
import CreateIssueButton from "../../components/taskButton/CreateTaskButton";
import "./TaskList.css";
import { Droppable, Draggable } from '@hello-pangea/dnd';


const TaskList = ({ handleCreateSprint }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { sprints } = useSelector((state) => state.sprints);
  const { selectedProjectId } = useSelector((state) => state.projects);

useEffect(() => {
  if (!selectedProjectId) return;  // ✅ <-- ADD THIS LINE
  dispatch(clearTasks());
  dispatch(fetchTasks(selectedProjectId));
  dispatch(fetchSprints());
}, [dispatch, selectedProjectId]);


  // Filter tasks to only show those not assigned to a sprint (backlog tasks)
  const backlogTasks = tasks.filter(task => !task.sprint);

  return (
    <div className="sprint-info">
      <strong>Backlog</strong>
      <div className="empty-backlog-message">
        {backlogTasks.length === 0 ? (
          <div className="empty-backlog">
            <p>No tasks found in the backlog. All tasks have been assigned to sprints or no tasks exist for this project.</p>
          </div>
        ) : (
          <Droppable droppableId="backlog">
            {(provided) => (
              <div
                className="task-list-container"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {backlogTasks.map((task, index) => (
                  <Draggable
                    key={task.id}
                    draggableId={`task-${task.id}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        className="task-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TaskItem
                          task={task}
                          sprints={sprints}
                          selectedProjectId={selectedProjectId}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

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
