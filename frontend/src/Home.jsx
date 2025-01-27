import React, { useState } from 'react';
import Navbar from './screens/navbar/navbar.jsx';
import Sidebar from './screens/sidebar/sidebar.jsx';
import Backlog from './screens/backlog/backlog';
import Board from './screens/board/board'; 
import Timeline from './screens/timeline/timeline'; 
import './Home.css';

const Home = () => {
  const [activeComponent, setActiveComponent] = useState(''); 

  const toggleComponent = (component) => {
    setActiveComponent((prev) => (prev === component ? '' : component)); 
  };

  return (
    <div className="home">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="home-container">
        {/* Sidebar */}
        <Sidebar toggleComponent={toggleComponent} />

        {/* Home Content */}
        <div className="home-content">
          {activeComponent === 'backlog' && <Backlog />}
          {activeComponent === 'board' && <Board toggleComponent={toggleComponent} />}
          {activeComponent === 'timeline' && <Timeline />}
        </div>
      </div>
    </div>
  );
};

export default Home;
