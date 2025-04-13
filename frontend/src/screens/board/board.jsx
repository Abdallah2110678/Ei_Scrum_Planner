import React, { useEffect, useState } from 'react';
import './board.css';
import { Link } from 'react-router-dom';
import TaskCard from '../../components/taskCard/taskCard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, updateTask } from '../../features/tasks/taskSlice';
import { fetchSprints } from '../../features/sprints/sprintSlice';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Board = ({ toggleComponent }) => {
  const dispatch = useDispatch();
  const { tasks, isLoading } = useSelector((state) => state.tasks);
  const { sprints } = useSelector((state) => state.sprints);
  const { selectedProjectId } = useSelector((state) => state.projects);

  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState(tasks);

  // Sync localTasks with Redux tasks when tasks change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Fetch tasks and sprints when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      console.log('Fetching data for project:', selectedProjectId);
      dispatch(fetchTasks());
      dispatch(fetchSprints(selectedProjectId));
    }
  }, [dispatch, selectedProjectId]);

  // Filter tasks from active sprints
  const activeSprints = sprints.filter((sprint) => sprint.is_active);
  const activeSprintIds = activeSprints.map((sprint) => sprint.id);
  const activeTasks = localTasks.filter((task) => activeSprintIds.includes(task.sprint));

  // Handle drag end
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      console.log('Dropped outside droppable');
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      console.log('Dropped in same position');
      return;
    }

    const taskId = parseInt(draggableId.replace('task-', ''), 10);
    const newStatus = destination.droppableId;
    console.log('Dragging task:', { taskId, from: source.droppableId, to: newStatus });

    // Optimistic update
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      await dispatch(
        updateTask({
          id: taskId,
          taskData: { status: newStatus },
        })
      ).unwrap();
      console.log('Task status updated:', { taskId, newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert optimistic update on error
      setLocalTasks(tasks);
    }
  };

  // Define columns
  const columns = [
    { id: 'TO DO', title: 'TO DO' },
    { id: 'IN PROGRESS', title: 'IN PROGRESS' },
    { id: 'DONE', title: 'DONE' },
  ];

  return (
    <div className="board-container">
      {/* Projects / School as hyperlinks */}
      <div className="projects-school-links">
        <Link to="/projects" className="project-link">
          Projects
        </Link>
        <span className="separator"> / </span>
        <Link to="/school" className="school-link">
          School
        </Link>
      </div>

      <h2>Board</h2>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            className="search-input"
          />
        </div>
      </div>

      {/* Columns Section */}
      {isLoading ? (
        <p>Loading tasks...</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="columns-section">
            {columns.map((column) => (
              <Droppable droppableId={column.id} key={column.id}>
                {(provided) => (
                  <div
                    className="column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="column-header">
                      <h3>{column.title}</h3>
                    </div>
                    <div className="column-content">
                      {activeTasks
                        .filter((task) => task.status === column.id)
                        .map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={`task-${task.id}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="task-card-wrapper"
                              >
                                <TaskCard task={task} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default Board;