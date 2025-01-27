import React from 'react';
import Home from './Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Backlog from '../src/screens/backlog/backlog.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Home as the layout */}
        <Route path="/" element={<Home />}>
          {/* Default route for Home */}
          <Route
            index
            element={
              <div>
                <h1>Welcome to EI Scrum Planner</h1>
                <p>This is the home page of the application.</p>
              </div>
            }
          />
          {/* Backlog route */}
          <Route path="backlog" element={<Backlog />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;