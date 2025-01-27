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
          
          {/* Backlog route */}
          <Route path="backlog" element={<Backlog />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;