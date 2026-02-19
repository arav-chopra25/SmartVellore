import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, Upload, AlertCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "../leafletFix";

function LocationMarker({ setPosition }) {
  const [position, setLocalPosition] = useState(null);

  useMapEvents({
    click(e) {
      setLocalPosition(e.latlng);
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function IssueForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [position, setPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!position) {
      setError("Please select a location on the map by clicking on it");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an issue title");
      return;
    }

    if (!description.trim()) {
      setError("Please enter an issue description");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("latitude", position.lat);
      formData.append("longitude", position.lng);
      if (image) formData.append("image", image);

      await onSubmit(formData);

      // Reset form
      setTitle("");
      setDescription("");
      setImage(null);
      setPosition(null);
      setError("");
      alert("Issue reported successfully!");
    } catch (err) {
      setError("Failed to submit issue. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 backdrop-blur-md">
      <div className="flex items-center space-x-3 mb-6">
        <MapPin className="w-6 h-6 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">Report an Issue</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Issue Title
          </label>
          <input
            type="text"
            placeholder="E.g., Pothole on Main Street"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Description
          </label>
          <textarea
            placeholder="Describe the issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Attach Image (Optional)
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="hidden"
              id="image-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
            >
              <Upload size={18} className="text-slate-400" />
              <span className="text-slate-400">
                {image ? image.name : "Click to upload a photo"}
              </span>
            </label>
          </div>
        </div>

        {/* Map Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Select Location on Map
          </label>
          <div className="rounded-lg overflow-hidden border border-white/10">
            <MapContainer
              center={[12.9165, 79.1325]} // Vellore coordinates
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: "350px", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker setPosition={setPosition} />
            </MapContainer>
          </div>
          {position && (
            <div className="text-sm text-blue-400 flex items-center space-x-2 mt-2">
              <MapPin size={14} />
              <span>Location selected: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
            </div>
          )}
          {!position && (
            <div className="text-sm text-slate-500 flex items-center space-x-2 mt-2">
              <AlertCircle size={14} />
              <span>Click on the map to select the issue location</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 font-medium flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 rounded-lg shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] uppercase text-sm tracking-widest"
        >
          {isLoading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}

export default IssueForm;
