import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { fetchIssues, updateIssueStatus } from "../api";
import "leaflet/dist/leaflet.css";

// Fix default marker issue (IMPORTANT)
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    const data = await fetchIssues();
    setIssues(data);
  };

  const changeStatus = async (id, status) => {
    try {
      await updateIssueStatus(id, status);
      loadIssues();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin – Issue Management</h2>

      {issues.length === 0 && <p>No issues reported yet.</p>}

      {issues.map((issue) => (
        <div
          key={issue.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 15,
            cursor: "pointer",
          }}
          onClick={() => setSelectedIssue(issue)}
        >
          <h3>{issue.title}</h3>
          <p>{issue.description}</p>

          <p>
            <b>Status:</b>{" "}
            <select
              value={issue.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => changeStatus(issue.id, e.target.value)}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </p>

          {issue.image_path && (
            <img
              src={`http://127.0.0.1:8000/${issue.image_path}`}
              alt="issue"
              style={{ width: 250, marginTop: 10 }}
            />
          )}
        </div>
      ))}

      {/* ===== MAP VIEW FOR SELECTED ISSUE ===== */}
      {selectedIssue && (
        <>
          <h3>Issue Location</h3>

          <MapContainer
            center={[
              selectedIssue.latitude,
              selectedIssue.longitude,
            ]}
            zoom={15}
            style={{ height: 350, marginTop: 10 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker
              position={[
                selectedIssue.latitude,
                selectedIssue.longitude,
              ]}
            >
              <Popup>
                <b>{selectedIssue.title}</b>
                <br />
                {selectedIssue.status}
              </Popup>
            </Marker>
          </MapContainer>
        </>
      )}
    </div>
  );
}
