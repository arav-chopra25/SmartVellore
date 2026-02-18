import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { submitIssue } from "../api";
import "leaflet/dist/leaflet.css";

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

export default function IssueForm({ onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      alert("Fill all fields & select location");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("latitude", location.lat);
    formData.append("longitude", location.lng);
    if (image) formData.append("image", image);

    try {
      setLoading(true);
      await submitIssue(formData);
      alert("Issue submitted successfully ✅");
      setTitle("");
      setDescription("");
      setImage(null);
      setLocation(null);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to submit issue ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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

      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        style={{ marginBottom: 8 }}
      />

      <MapContainer
        center={[12.9716, 80.0453]}
        zoom={14}
        style={{ height: 300, marginBottom: 10 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker onPick={setLocation} />
        {location && <Marker position={location} />}
      </MapContainer>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Submit Issue"}
      </button>
    </div>
  );
}
