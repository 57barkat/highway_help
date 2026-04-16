import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { adminApi } from "../api/adminApi";
import "leaflet/dist/leaflet.css";
import "../styles/AdminLiveHelpersMap.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: icon, shadowUrl: iconShadow });

interface Helper {
  id: number;
  name: string;
  email: string;
  lat: number;
  lng: number;
  rating: number;
  ratingCount: number;
  totalEarnings: number;
  isBusy: boolean;
  isOnline: boolean;
}

const center: [number, number] = [33.6844, 73.0479];

const AdminLiveHelpersMap = () => {
  const [helpers, setHelpers] = useState<Helper[]>([]);

  const fetchOnlineHelpers = async () => {
    try {
      const res = await adminApi.get("/online-helpers");
      setHelpers(res.data.helpers || []);
    } catch {}
  };

  useEffect(() => {
    fetchOnlineHelpers();
    const interval = setInterval(fetchOnlineHelpers, 5000);
    return () => clearInterval(interval);
  }, []);

  const helperIcon = (isBusy: boolean) =>
    new L.DivIcon({
      className: "custom-div-icon",
      html: `<div class="marker-pin ${isBusy ? "busy" : "available"}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

  return (
    <div className="map-page">
      <header className="map-header">
        <div className="header-left">
          <div className="brand-badge">Rescue Admin</div>
          <h2>Live Fleet Monitor</h2>
          <div className="live-indicator">
            <span className="dot pulse"></span>LIVE
          </div>
        </div>
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">ONLINE</span>
            <span className="stat-value">{helpers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">BUSY</span>
            <span className="stat-value">
              {helpers.filter((h) => h.isBusy).length}
            </span>
          </div>
        </div>
      </header>

      <main className="map-main-content">
        <div className="fleet-sidebar">
          <div className="sidebar-header">Active Helpers</div>
          <div className="helper-list">
            {helpers.map((helper) => (
              <div key={helper.id} className="helper-list-card">
                <div className="card-top">
                  <span className="helper-name">{helper.name}</span>
                  <span
                    className={`status-dot ${helper.isBusy ? "busy" : "available"}`}
                  ></span>
                </div>
                <div className="card-email">{helper.email}</div>
                <div className="card-earnings">
                  Earnings: Rs. {helper.totalEarnings.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="map-container">
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {helpers
              .filter((h) => h.lat && h.lng)
              .map((helper) => (
                <Marker
                  key={helper.id}
                  position={[Number(helper.lat), Number(helper.lng)]}
                  icon={helperIcon(helper.isBusy)}
                >
                  <Popup className="custom-popup">
                    <div className="info-card">
                      <div className="info-header">
                        <h3>{helper.name}</h3>
                        <span
                          className={`status-tag ${helper.isBusy ? "busy" : "available"}`}
                        >
                          {helper.isBusy ? "On Job" : "Available"}
                        </span>
                      </div>
                      <div className="info-body">
                        <div className="info-row-detail">
                          <label>Email:</label>
                          <span>{helper.email}</span>
                        </div>
                        <div className="info-row-detail">
                          <label>Rating:</label>
                          <span>
                            ⭐ {Number(helper.rating || 0).toFixed(1)} (
                            {helper.ratingCount} reviews)
                          </span>
                        </div>
                        <div className="info-row-detail">
                          <label>Total Earnings:</label>
                          <span className="earnings-text">
                            Rs. {helper.totalEarnings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {/* <button className="track-btn">Track Movement</button> */}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};
export default AdminLiveHelpersMap;
