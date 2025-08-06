import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { DataRefreshProvider } from "./context/DataRefreshContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Transaction from "./pages/Transaction";
import Settings from "./pages/Settings";
import AddEntryModal from "./components/AddEntryModal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LoadingSpinner from "./components/LoadingSpinner";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isRateLimited } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isRateLimited) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Too Many Requests
          </h2>
          <p className="text-gray-600 mb-6">
            You've made too many requests in a short period. Please wait a
            moment before trying again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isRateLimited } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isRateLimited) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Too Many Requests
          </h2>
          <p className="text-gray-600 mb-6">
            You've made too many requests in a short period. Please wait a
            moment before trying again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <DataRefreshProvider>
        <Router>
          <div className="min-h-screen bg-slate-50">
            <NavBar />
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transaction"
                element={
                  <ProtectedRoute>
                    <Transaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
            </Routes>
            <AddEntryModal />
          </div>
        </Router>
      </DataRefreshProvider>
    </AuthProvider>
  );
}

export default App;
