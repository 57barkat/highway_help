import React, { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    adminApi.get("/stats").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Admin Insights</h1>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Users</span>
          <h2>{stats.counts.totalUsers}</h2>
        </div>
        <div className="stat-card blue">
          <span>Verified Helpers</span>
          <h2>{stats.counts.totalHelpers}</h2>
        </div>
        <div className="stat-card orange">
          <span>Pending Helpers</span>
          <h2>{stats.counts.pendingHelpers}</h2>
        </div>
      </div>

      <div className="charts-section">
        {/* Line Chart for Trends */}
        <div className="chart-container">
          <h3>Request Trends (Weekly)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart for Distribution */}
        <div className="chart-container">
          <h3>User vs Helper Ratio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: "Users", count: stats.counts.totalUsers },
                { name: "Helpers", count: stats.counts.totalHelpers },
              ]}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
