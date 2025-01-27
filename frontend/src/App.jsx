import React from 'react';
import Home from './Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Backlog from '../src/screens/backlog/backlog.jsx';
import Board from '../src/screens/board/board.jsx'; 
import Timeline from '../src/screens/timeline/timeline.jsx'; 

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Home as the layout */}
        <Route path="/" element={<Home />}>
          {/* Backlog route */}
          <Route path="backlog" element={<Backlog />} />

          {/* Board route */}
          <Route path="board" element={<Board />} />

          {/* Timeline route */}
          <Route path="timeline" element={<Timeline />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
