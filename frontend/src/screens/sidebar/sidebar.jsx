import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <button className="hamburger-button" onClick={toggleSidebar}>
          <span className="hamburger-icon">☰</span>
        </button>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link to="/eiscrum/timeline" className="sidebar-link" >
              <span className="sidebar-icon">📅</span>
              <span className="sidebar-text">Timeline</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/eiscrum/backlog" className="sidebar-link" >
              <span className="sidebar-icon">📋</span>
              <span className="sidebar-text">Backlog</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/eiscrum/board" className="sidebar-link" >
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-text">Board</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/eiscrum/history" className="sidebar-link" >
              <span className="sidebar-icon">🕘</span> {/* You can choose any icon */}
              <span className="sidebar-text">History</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/eiscrum/gamification" className="sidebar-link" >
              <span className="sidebar-icon">🏆</span> {/* You can choose any icon */}
              <span className="sidebar-text">Gamification</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/eiscrum/participant" className="sidebar-link" >
              <span className="sidebar-icon">👥</span> {/* You can choose any icon */}
              <span className="sidebar-text">Participant</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-overlay" onClick={toggleSidebar}></div>
    </>
  );
};

export default Sidebar;