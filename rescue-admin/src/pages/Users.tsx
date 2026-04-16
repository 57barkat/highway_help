import React, { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import "../styles/Users.css";

interface User {
  id: number;
  name: string;
  email: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email });
  };

  const handleUpdate = async (id: number) => {
    try {
      await adminApi.patch(`/users/${id}`, editForm);
      setUsers(users.map((u) => (u.id === id ? { ...u, ...editForm } : u)));
      setEditingId(null);
    } catch (err) {
      alert("Failed to update user");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await adminApi.delete(`/users/${id}`);
        setUsers(users.filter((u) => u.id !== id));
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="users-page">
      <header className="page-header">
        <div className="header-top-row">
          <div className="title-section">
            <h1>User Management</h1>
            {/* <p className="subtitle">
              View and manage your platform's registered users
            </p> */}
          </div>
          <div className="stats-badge">
            <span className="count">{users.length}</span> Total Users
          </div>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="main-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Fetching user records...</p>
        </div>
      ) : (
        <div className="users-list">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`user-row-card ${editingId === user.id ? "is-editing" : ""}`}
            >
              {editingId === user.id ? (
                <div className="edit-mode-container">
                  <div className="edit-inputs">
                    <input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      placeholder="Name"
                    />
                    <input
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      placeholder="Email"
                    />
                  </div>
                  <div className="edit-actions">
                    <button
                      className="save-btn"
                      onClick={() => handleUpdate(user.id)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="view-mode-container">
                  <div className="user-profile-info">
                    <div className="user-avatar-circle">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-text">
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button
                      className="btn-edit-outline"
                      onClick={() => startEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete-ghost"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!loading && filteredUsers.length === 0 && (
            <div className="empty-state-card">
              <p>No users found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
