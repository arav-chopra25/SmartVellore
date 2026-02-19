import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle, Clock, MapPin, Filter } from "lucide-react";

export default function AdminDashboard({ token }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get("http://127.0.0.1:8000/admin/issues", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setIssues(response.data);
    } catch (err) {
      setError("Failed to load issues. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/issues/${id}`,
        { status: newStatus },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      // Refresh the issues list
      loadIssues();
    } catch (err) {
      setError("Failed to update status. Please try again.");
      console.error(err);
    }
  };

  const filteredIssues = issues.filter(
    (issue) => filter === "ALL" || issue.status === filter
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "RESOLVED":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
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
        <div className="mb-8">
          <h2 className="text-4xl font-black mb-2">Administration Panel</h2>
          <p className="text-slate-400">Manage and track all civic issues</p>
        </div>

        {/* Filter Controls */}
        <div className="mb-8 flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2 text-slate-400">
            <Filter size={18} />
            <span className="text-sm font-semibold uppercase tracking-widest">Filter:</span>
          </div>
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all ${
                filter === status
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-slate-800/40 text-slate-400 hover:bg-slate-700/40"
              }`}
            >
              {status}
            </button>
          ))}
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
            {/* Issues Count */}
            <div className="mb-6 text-sm text-slate-400">
              Showing <span className="text-white font-semibold">{filteredIssues.length}</span> of{" "}
              <span className="text-white font-semibold">{issues.length}</span> issues
            </div>

            {/* Issues Grid */}
            {filteredIssues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-slate-900/40 border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(issue.status)}
                          <h3 className="text-xl font-bold text-white">{issue.title}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{issue.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(
                          issue.status
                        )}`}
                      >
                        {issue.status}
                      </span>
                    </div>

                    {/* Location Info */}
                    <div className="flex items-center space-x-2 text-slate-400 text-sm mb-4">
                      <MapPin size={16} className="text-blue-400" />
                      <span>
                        {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                      </span>
                    </div>

                    {/* Issue Image */}
                    {issue.image_path && (
                      <div className="mb-4 rounded-lg overflow-hidden bg-black/20">
                        <img
                          src={`http://127.0.0.1:8000/${issue.image_path}`}
                          alt="issue"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* Status Update Controls */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                        Update Status:
                      </span>
                      <select
                        value={issue.status}
                        onChange={(e) => changeStatus(issue.id, e.target.value)}
                        className="px-3 py-2 bg-slate-800/60 border border-white/10 rounded-lg text-white text-sm font-semibold hover:border-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>

                    {/* Timestamp */}
                    <div className="mt-4 text-[11px] text-slate-500 border-t border-white/5 pt-3">
                      Reported: {new Date(issue.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 text-lg">No issues found matching the current filter</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
