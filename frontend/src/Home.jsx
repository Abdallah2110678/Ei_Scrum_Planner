import React from 'react';
import Navbar from './screens/navbar/navbar.jsx';
import Sidebar from './screens/sidebar/sidebar.jsx';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="home-container">
        {/* Sidebar */}
        <Sidebar />

        {/* Home Content */}
        <div className="home-content">
          <h1>Welcome to EI Scrum Planner</h1>
          <p>This is the home page of the application.</p>
          {/* Add more content here as needed */}
        </div>
      </div>
    </div>
  );
};

export default Home;