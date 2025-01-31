import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Backlog from "./screens/backlog/backlog";
import Board from "./screens/board/board";
import Timeline from "./screens/timeline/timeline";
import LoginForm from "./screens/login/login";
import RegistrationForm from "./screens/registerationForm/registeration.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Home Layout that wraps other pages */}
        <Route path="/" element={<Home />}>
          <Route index element={<Timeline />} />
          <Route path="backlog" element={<Backlog />} />
          <Route path="board" element={<Board />} />
          <Route path="/timeline" element={<Timeline />} />
        </Route>

        {/* Login and Registration */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />
      </Routes>
    </Router>
  );
};

export default App;
