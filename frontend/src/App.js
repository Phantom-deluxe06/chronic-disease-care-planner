/**
 * HealthBuddy Care Planner
 * Main App Component with Routing
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import DiabetesDashboard from './pages/DiabetesDashboard';
import HypertensionDashboard from './pages/HypertensionDashboard';
import './App.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />

        {/* Disease-Specific Dashboards */}
        <Route path="/dashboard/diabetes" element={
          <ProtectedRoute>
            <DiabetesDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hypertension" element={
          <ProtectedRoute>
            <HypertensionDashboard />
          </ProtectedRoute>
        } />

        {/* Placeholder routes for future pages */}
        <Route path="/logs" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/care-plan" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

