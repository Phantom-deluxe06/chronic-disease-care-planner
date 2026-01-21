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
import HealthLogs from './pages/HealthLogs';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ChatBot from './components/ChatBot';
import { LanguageProvider } from './context/LanguageContext';
import './App.css';

// Protected Route wrapper with ChatBot
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      {children}
      <ChatBot />
    </>
  );
};

function App() {
  return (
    <LanguageProvider>
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

          {/* Health Management Pages */}
          <Route path="/logs" element={
            <ProtectedRoute>
              <HealthLogs />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Strava OAuth Callback - redirects to settings */}
          <Route path="/strava/callback" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </LanguageProvider>
  );
}

export default App;

