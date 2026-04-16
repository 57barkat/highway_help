import React, { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import styles from "../styles/SettingsPage.module.css";

const SettingsPage: React.FC = () => {
  const [commission, setCommission] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch current commission on mount
  useEffect(() => {
    fetchCommission();
  }, []);

  const fetchCommission = async () => {
    try {
      const response = await adminApi.get("/commission");
      setCommission(response.data.commission);
    } catch (error) {
      console.error("Failed to fetch commission", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      const response = await adminApi.put("/commission", {
        percent: commission,
      });
      setMessage({ type: "success", text: response.data.message });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className={styles.loader}>Loading settings...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>App Settings</h2>

      <div className={styles.card}>
        <h3>Platform Commission</h3>
        <p className={styles.description}>
          Set the percentage fee charged on every job request.
        </p>

        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              min="0"
              max="100"
              step="0.1"
              required
            />
            <span className={styles.percentSymbol}>%</span>
          </div>

          <button type="submit" disabled={updating} className={styles.saveBtn}>
            {updating ? "Updating..." : "Save Changes"}
          </button>
        </form>

        {message && (
          <div className={`${styles.alert} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
