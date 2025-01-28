
import Home from './Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Backlog from '../src/screens/backlog/backlog.jsx';
import Board from '../src/screens/board/board.jsx'; 
import Timeline from '../src/screens/timeline/timeline.jsx';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <>
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
    <ToastContainer />
    </>
  );
};

export default App;
