import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import SignupAdmin from './pages/SignupAdmin';
import Login from './pages/Login';
import AdminMain from './pages/AdminMain';
import PlayerMain from './pages/PlayerMain';
import Results from './pages/Results';
import Live from './pages/Live';
import { useAuth } from './context/AuthContext';
import './App.css';

// A simple private route component (can be made more sophisticated)
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

// An admin-only route component
const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return isAdmin ? element : <Navigate to="/player/main" />; // Redirect non-admins
};


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signupAdmin" element={<SignupAdmin />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/admin/main" element={<AdminRoute element={<AdminMain />} />} />
        <Route path="/admin/results" element={<AdminRoute element={<Results />} />} />
        <Route path="/player/main" element={<PrivateRoute element={<PlayerMain />} />} />
        <Route path="/live" element={<PrivateRoute element={<Live />} />} />

        {/* Redirect authenticated users to their main page, others to login */}
        <Route path="/" element={<Navigate to="/login" />} /> {/* Default redirect */}

      </Routes>
    </Router>
  );
};

export default App;
