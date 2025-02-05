import React from 'react';
import './board.css';
import { Link } from 'react-router-dom';
import TaskCard from '../../components/taskCard/taskCard';
import { useEffect } from 'react';
import { useDispatch ,useSelector } from 'react-redux';
import { fetchSprints } from '../../features/sprints/sprintSlice';


const Board = ({ toggleComponent }) => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);

  useEffect(() => {
    dispatch(fetchSprints());
  }, [dispatch]);

  // Filter active sprints
  const activeSprints = sprints.filter((sprint) => sprint.is_active);

  return (
    <div className="board-container">
      {/* Projects / School as hyperlinks */}
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Projects</a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">School</a>
      </div>
      
      <h2>Board</h2>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar">
          <input type="text" placeholder="Search" className="search-input" />
        </div>
      </div>

      {/* Columns Section */}
      <div className="columns-section">
        {/* TO DO Column */}
        <div className="column">
          <div className="column-header">
            <h3>TO DO</h3>
          </div>
          <div className="column-content">
            {activeSprints.flatMap((sprint) =>
              sprint.tasks
                .filter((task) => task.status === "TO DO")
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    description={task.task_name}
            
                    count={task.story_points}
                  />
                ))
            )}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="column">
          <div className="column-header">
            <h3>IN PROGRESS</h3>
          </div>
          <div className="column-content">
            {activeSprints.flatMap((sprint) =>
              sprint.tasks
                .filter((task) => task.status === "IN PROGRESS")
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    description={task.task_name}
            
                    count={task.story_points}
                  />
                ))
            )}
          </div>
        </div>

        {/* DONE Column */}
        <div className="column">
          <div className="column-header">
            <h3>DONE</h3>
          </div>
          <div className="column-content">
            {activeSprints.flatMap((sprint) =>
              sprint.tasks
                .filter((task) => task.status === "DONE")
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    description={task.task_name}
                    count={task.story_points}
                  />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;