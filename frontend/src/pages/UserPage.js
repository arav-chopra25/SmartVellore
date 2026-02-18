import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { fetchIssues, submitIssue } from "../api";
import "leaflet/dist/leaflet.css";

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

export default function UserPage() {
  const [issues, setIssues] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    const data = await fetchIssues();
    setIssues(data);
  }

  async function handleSubmit() {
    if (!location) return alert("Select location on map");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("latitude", location.lat);
    formData.append("longitude", location.lng);
    if (image) formData.append("image", image);

    try {
      await submitIssue(formData);
      alert("Issue submitted");
      setTitle("");
      setDescription("");
      setLocation(null);
      setImage(null);
      loadIssues();
    } catch {
      alert("Failed to submit issue");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>SmartVellore – Civic Issues</h1>

      <h2>Report an Issue</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <input type="file" onChange={(e) => setImage(e.target.files[0])} />

      <MapContainer
        center={[12.9716, 79.1594]}
        zoom={15}
        style={{ height: 300, margin: "10px 0" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker onPick={setLocation} />
        {location && <Marker position={location} />}
      </MapContainer>

      <button onClick={handleSubmit}>Submit Issue</button>

      <hr />

      <h2>Reported Issues</h2>
      {issues.map((i) => (
        <div key={i.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <h3>{i.title}</h3>
          <p>{i.description}</p>
          <p>Status: {i.status}</p>
          {i.image_path && (
            <img
              src={`http://127.0.0.1:8000/${i.image_path}`}
              alt=""
              style={{ width: 250 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
