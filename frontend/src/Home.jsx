import React, { useState } from 'react';
import Navbar from './screens/navbar/navbar.jsx';
import Sidebar from './screens/sidebar/sidebar.jsx';
import Backlog from './screens/backlog/Backlog';
import './Home.css';

const Home = () => {
  const [showBacklog, setShowBacklog] = useState(false);

  const toggleBacklog = () => {
    setShowBacklog((prev) => !prev);
  };

  return (
    <div className="home">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="home-container">
        {/* Sidebar */}
        <Sidebar toggleBacklog={toggleBacklog} />

        {/* Home Content */}
        <div className="home-content">
          {showBacklog && <Backlog />}
        </div>
      </div>
    </div>
  );
};

export default Home;
