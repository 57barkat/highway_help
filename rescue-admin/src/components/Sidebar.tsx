import React from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import "../styles/Sidebar.css";

const Sidebar: React.FC = () => {
  const { logout } = useAdminAuth();

  return (
    <aside className="sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/users">Users</Link>
          </li>
          <li>
            <Link to="/helpers">Helpers</Link>
          </li>
          <li>
            <Link to="/admin/live-helpers">Live Helpers Map</Link>
          </li>
          <li>
            <Link to="/feeSettings">Settings</Link>
          </li>
          {/* <li>
            <Link to="/requests">Requests</Link>
          </li> */}
        </ul>
      </nav>
      <button onClick={logout}>Logout</button>
    </aside>
  );
};

export default Sidebar;
