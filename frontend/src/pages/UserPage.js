import React, { useEffect, useState } from "react";
import axios from "axios";
import IssueForm from "../components/IssueForm";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { AlertCircle, CheckCircle, Clock, MapPin } from "lucide-react";
import "../leafletFix";

function UserPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get("http://127.0.0.1:8000/issues");
      setIssues(res.data);
    } catch (err) {
      setError("Failed to load issues. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const submitIssue = async (formData) => {
    try {
      await axios.post("http://127.0.0.1:8000/issues", formData);
      fetchIssues();
    } catch (err) {
      console.error("Failed to submit issue", err);
      alert("Failed to submit issue. Please try again.");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case "IN_PROGRESS":
        return <Clock className="w-6 h-6 text-yellow-400" />;
      case "RESOLVED":
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "IN_PROGRESS":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "RESOLVED":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-black mb-2">Citizen Portal</h2>
          <p className="text-slate-400">Report and track civic issues in your community</p>
        </div>

        {/* Issue Form */}
        <div className="mb-12">
          <IssueForm onSubmit={submitIssue} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Issues Header */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Reported Issues</h3>
              <p className="text-slate-400 text-sm">
                Total reports: <span className="font-semibold text-white">{issues.length}</span>
              </p>
            </div>

            {/* Issues Grid */}
            {issues.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-slate-900/40 border border-white/5 hover:border-blue-500/30 rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <div className="p-6">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(issue.status)}
                            <h4 className="text-2xl font-bold text-white">{issue.title}</h4>
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border whitespace-nowrap ml-4 ${getStatusColor(
                            issue.status
                          )}`}
                        >
                          {issue.status}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-slate-300 mb-4 leading-relaxed">{issue.description}</p>

                      {/* Location */}
                      <div className="flex items-center space-x-2 text-slate-400 text-sm mb-6">
                        <MapPin size={18} className="text-blue-400" />
                        <span>
                          Latitude: {issue.latitude.toFixed(6)}, Longitude: {issue.longitude.toFixed(6)}
                        </span>
                      </div>

                      {/* Image */}
                      {issue.image_path && (
                        <div className="mb-6 rounded-lg overflow-hidden bg-black/20 max-h-96">
                          <img
                            src={`http://127.0.0.1:8000/${issue.image_path}`}
                            alt="issue"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}

                      {/* Map */}
                      <div className="mb-6 rounded-lg overflow-hidden">
                        <MapContainer
                          center={[issue.latitude, issue.longitude]}
                          zoom={15}
                          scrollWheelZoom={false}
                          style={{ height: "250px", width: "100%" }}
                        >
                          <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[issue.latitude, issue.longitude]} />
                        </MapContainer>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[11px] text-slate-500 border-t border-white/5 pt-3">
                        Reported: {new Date(issue.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 text-lg">No issues reported yet</p>
                <p className="text-slate-500 text-sm mt-2">Be the first to report a civic issue</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserPage;
