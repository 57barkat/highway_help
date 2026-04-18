import React, { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import "../styles/Helpers.css";

interface Helper {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string | null;
  isVerified: boolean;
}

const Helpers: React.FC = () => {
  const [helpers, setHelpers] = useState<Helper[]>([]);

  useEffect(() => {
    adminApi.get("/helpers").then((res) => setHelpers(res.data.helpers));
  }, []);

  const toggleVerify = async (id: number, verify: boolean) => {
    try {
      await adminApi.patch(`/helpers/${id}/verify`, { isVerified: verify });
      setHelpers((prev) =>
        prev.map((h) => (h.id === id ? { ...h, isVerified: verify } : h)),
      );
    } catch (err) {
      console.error("Verification update failed", err);
    }
  };

  return (
    <div className="helpers-page">
      <header className="page-header">
        <h1>Helpers Management</h1>
        <p>Verify or manage helper account permissions</p>
      </header>

      <div className="helpers-grid">
        {helpers.map((h) => (
          <div
            key={h.id}
            className={`helper-card ${h.isVerified ? "verified" : "pending"}`}
          >
            <div className="helper-avatar">{h.name.charAt(0)}</div>
            <div className="helper-details">
              <h3>{h.name}</h3>
              <p>{h.email}</p>
              <p>{h.phoneNumber || "No phone number"}</p>
            </div>
            <div className="helper-status">
              <span
                className={`status-tag ${h.isVerified ? "tag-verified" : "tag-pending"}`}
              >
                {h.isVerified ? "Verified" : "Pending"}
              </span>
            </div>
            <button
              className={`action-btn ${h.isVerified ? "btn-unverify" : "btn-verify"}`}
              onClick={() => toggleVerify(h.id, !h.isVerified)}
            >
              {h.isVerified ? "Revoke Access" : "Approve Helper"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Helpers;
