import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Users from "./pages/Users";
import Helpers from "./pages/Helpers";
import Requests from "./pages/Requests";
import Dashboard from "./pages/Dashboard";
import "./App.css";
import SettingsPage from "./pages/SettingsPage";
import AdminLiveHelpersMap from "./pages/AdminLiveHelpersMap";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminToken } = useAdminAuth();
  const location = useLocation();

  return (
    <div className="app-container">
      {adminToken && <Sidebar />}
      <main
        key={location.pathname} // Forces re-animation on route change
        className={`main-content ${adminToken ? "with-sidebar" : "full-width"} page-enter`}
      >
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { adminToken } = useAdminAuth();
  // If no token, redirect to login but keep the intended destination
  return adminToken ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AdminAuthProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/helpers"
            element={
              <ProtectedRoute>
                <Helpers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feeSettings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/live-helpers" element={<AdminLiveHelpersMap />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </AdminAuthProvider>
  );
}

export default App;
