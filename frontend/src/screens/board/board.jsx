import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import TaskCard from '../../components/taskCard/taskCard';
import { fetchSprints } from '../../features/sprints/sprintSlice';
import { fetchTasks, updateTask } from '../../features/tasks/taskSlice';
import './board.css';

const Board = ({ toggleComponent }) => {
  const dispatch = useDispatch();
  const { tasks, isLoading } = useSelector((state) => state.tasks);
  const { sprints } = useSelector((state) => state.sprints);
  const { selectedProjectId, projects } = useSelector((state) => state.projects);

  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState(tasks);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync localTasks with Redux tasks when tasks change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Track previous project ID to detect changes
  const prevProjectIdRef = useRef(selectedProjectId);

  // Fetch tasks and sprints when selectedProjectId changes
  useEffect(() => {
    const fetchData = async () => {
      if (selectedProjectId) {
        // Check if this is a project switch
        if (prevProjectIdRef.current !== selectedProjectId) {
          setIsTransitioning(true);
          // Clear local state
          setLocalTasks([]);
        }

        try {
          // Fetch data in parallel
          await Promise.all([
            dispatch(fetchTasks()).unwrap(),
            dispatch(fetchSprints(selectedProjectId)).unwrap()
          ]);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsTransitioning(false);
        }
      }
    };

    fetchData();
    prevProjectIdRef.current = selectedProjectId;
  }, [dispatch, selectedProjectId]);

  // Show loading state during transitions
  if (isTransitioning) {
    return <div className="loading-message">Loading project data...</div>;
  }

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
        <Link to="/projects" className="project-link">Project</Link>
        <span className="separator"> / </span>
        <span className="school-link">
          {selectedProjectId ? projects.find((p) => p.id === selectedProjectId)?.name || "Unnamed Project" : "No Project Selected"}
        </span>
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