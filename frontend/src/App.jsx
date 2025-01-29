import React from 'react';
import Home from './Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Backlog from '../src/screens/backlog/backlog.jsx';
import Board from '../src/screens/board/board.jsx'; 
import Timeline from '../src/screens/timeline/timeline.jsx'; 
import LoginForm from './screens/login/login.jsx';
import RegistrationForm from './screens/registerationForm/registeration.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Login and Registration routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />

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