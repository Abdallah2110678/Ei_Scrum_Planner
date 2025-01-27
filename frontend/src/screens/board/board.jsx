import React from 'react';
import './board.css';

const Board = () => {
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
          <input
            type="text"
            placeholder="Search "
            className="search-input"
          />
        </div>
      </div>
    </div>
  );
};

export default Board;
