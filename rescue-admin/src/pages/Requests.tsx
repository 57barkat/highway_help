import React, { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import "../styles/Requests.css";

interface Request {
  id: number;
  user: { name: string; email: string };
  helper: { name: string; email: string } | null;
  offers: any[];
}

const Requests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    adminApi.get("/requests").then((res) => setRequests(res.data.requests));
  }, []);

  return (
    <div className="requests-container">
      <header className="page-header">
        <h1>Service Requests</h1>
        <span className="badge">{requests.length} Total</span>
      </header>

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User Details</th>
              <th>Assigned Helper</th>
              <th>Offers</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td># {r.id}</td>
                <td>
                  <div className="user-info">
                    <span className="name">{r.user.name}</span>
                    <span className="email">{r.user.email}</span>
                  </div>
                </td>
                <td>
                  {r.helper ? (
                    <div className="helper-info">
                      <span className="name">{r.helper.name}</span>
                    </div>
                  ) : (
                    <span className="unassigned">Unassigned</span>
                  )}
                </td>
                <td>
                  <span className="offer-count">{r.offers.length} offers</span>
                </td>
                <td>
                  <span
                    className={`status-pill ${r.helper ? "active" : "pending"}`}
                  >
                    {r.helper ? "In Progress" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Requests;
