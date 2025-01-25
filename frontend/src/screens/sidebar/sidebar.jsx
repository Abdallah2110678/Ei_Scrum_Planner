import React from 'react';
import './sidebar.css'; // Import the CSS file for styling

const Sidebar = () => {
  return (
    <div className="sidebar">
      
      <ul className="sidebar-menu">
        <li className="sidebar-item">
          <a href="/timeline" className="sidebar-link">
            <span className="sidebar-icon">📅</span> {/* Emoji or custom icon for Timeline */}
            <span className="sidebar-text">Timeline</span>
          </a>
        </li>
        <li className="sidebar-item">
          <a href="/backlog" className="sidebar-link">
            <span className="sidebar-icon">📋</span> {/* Emoji or custom icon for Backlog */}
            <span className="sidebar-text">Backlog</span>
          </a>
        </li>
        <li className="sidebar-item">
          <a href="/board" className="sidebar-link">
            <span className="sidebar-icon">📊</span> {/* Emoji or custom icon for Board */}
            <span className="sidebar-text">Board</span>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;