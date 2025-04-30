import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Backlog from "./screens/backlog/backlog";
import Board from "./screens/board/board";
import Timeline from "./screens/timeline/timeline";
import LoginForm from "./screens/login/login";
import History from "./screens/history/history.jsx";
import RegistrationForm from "./screens/registerationForm/registeration.jsx";
import IntroductionPage from "./screens/Introduction/IntroductionPage.jsx";
import Dashboard from "./screens/Dashboard/Dashboard";
import { Navigate } from "react-router-dom";
import {useSelector} from 'react-redux';
import AcceptInvitation from "./components/acceptinvitation/acceptInvitation.jsx";
import GamificationPaga from "./screens/gamification/gamification.jsx";
import ParticipantsPage from "./screens/participant/participant.jsx";
import Profile from "./screens/profile/profile.jsx";
const PrivateRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/login" />;
};

// Public Route Wrapper (Only for Unauthenticated Users)
const PublicRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  return user ? <Navigate to="/eiscrum" /> : children;
};
const App = () => {
  return (
    <Router>
    <Routes>
      {/* Public Routes - Only Accessible If Not Logged In */}
      <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegistrationForm /></PublicRoute>} />
      <Route path="/" element={<PublicRoute><IntroductionPage /></PublicRoute>} />
      {/* Dashboard as a standalone route */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      {/* Protected Routes - Only Accessible If Logged In */}
      <Route path="/eiscrum" element={<PrivateRoute><Home /></PrivateRoute>}>
      <Route path="accept-invitation/:token" element={<AcceptInvitation />}/>
        <Route path="timeline" element={<Timeline />} />
        <Route path="backlog" element={<Backlog />} />
        <Route path="board" element={<Board />} />
        
        {/* Dashboard moved to standalone route */}
        <Route path="history" element={<History />} />
        <Route path="gamification" element={<GamificationPaga />} />
        <Route path="profile" element={<Profile />} />
        <Route path="participant" element={<ParticipantsPage />} />
      </Route>

      {/* Redirect All Unknown Routes to Home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </Router>
  );
};

export default App;
