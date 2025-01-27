import React from 'react';
import { Outlet } from 'react-router-dom';
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
          {/* Outlet for nested routes */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};


export default Home;