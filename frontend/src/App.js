import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import exifr from 'exifr';
import { 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  LogOut, 
  ShieldCheck,
  PlusCircle,
  BarChart3,
  Navigation,
  Sparkles,
  Loader2,
  X,
  Calendar,
  Maximize2,
  Trash2
} from 'lucide-react';

// --- CONSTANTS ---
const API_BASE = 'http://127.0.0.1:8000';
const VELLORE_CENTER = [12.9165, 79.1325];

const ISSUE_STATUS = {
  OPEN: { label: 'Open', color: 'bg-red-100 text-red-700 border-red-200' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

const DEPARTMENTS = [
  'Water Supply Department',
  'Public Works Department',
  'Electricity Department',
  'Solid Waste Management',
  'Traffic Department'
];

// --- GEMINI API INTEGRATION ---
const apiKey = "";

const callGemini = async (prompt, retries = 5, delay = 1000) => {
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(prompt, retries - 1, delay * 2);
      }
      throw new Error('Gemini API call failed');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }) => {
  const config = ISSUE_STATUS[status] || ISSUE_STATUS.OPEN;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
};

// Custom Map Component using global L (Leaflet)
const LeafletMap = ({ location, onLocationSelect, readOnly = false }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map only once on mount
  useEffect(() => {
    let isMounted = true;
    let checkInterval = null;

    const initMap = () => {
      if (!mapRef.current || mapInstance.current || !window.L) return;

      const L = window.L;
      try {
        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
          fadeAnimation: false,
          zoomAnimation: false
        }).setView(location, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        }).addTo(map);
        
        const marker = L.marker(location).addTo(map);

        mapInstance.current = map;
        markerInstance.current = marker;

        if (!readOnly && onLocationSelect) {
          map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            onLocationSelect([lat, lng]);
          });
        }
        
        setTimeout(() => {
          if (map && isMounted) {
            map.invalidateSize();
            setIsLoaded(true);
          }
        }, 100);
      } catch (err) {
        console.error("Map initialization failed", err);
        if (isMounted) setIsLoaded(true);
      }
    };

    // Wait for Leaflet to be available
    if (window.L) {
      setTimeout(() => {
        if (isMounted) initMap();
      }, 50);
    } else {
      checkInterval = setInterval(() => {
        if (window.L) {
          initMap();
          clearInterval(checkInterval);
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (mapInstance.current) {
        const map = mapInstance.current;
        mapInstance.current = null;
        markerInstance.current = null;
        try {
          map.off();
          map.remove();
        } catch (e) {
          console.warn("Error during map removal", e);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when location changes
  useEffect(() => {
    if (isLoaded && mapInstance.current && markerInstance.current && window.L) {
      const map = mapInstance.current;
      const marker = markerInstance.current;
      if (map.getContainer()) {
        map.setView(location, 15, { animate: false });
        marker.setLatLng(location);
      }
    }
  }, [location, isLoaded]);

  return (
    <div className="w-full h-full relative bg-slate-100">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[1001]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">Loading Vellore Map...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VIEW COMPONENTS ---

const Navbar = ({ setView, view, isAdmin, handleLogout }) => (
  <nav className="bg-white border-b border-gray-100 sticky top-0 z-[1000] px-6 py-4 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('user')}>
      <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100">
        <ShieldCheck size={22} />
      </div>
      <div>
        <h1 className="font-extrabold text-xl text-slate-800 tracking-tight">SmartVellore</h1>
        <p className="text-[10px] text-blue-500 uppercase tracking-[0.2em] font-bold">Citizen Connect</p>
      </div>
    </div>

    <div className="flex items-center gap-4">
      {view === 'user' && (
        <button 
          onClick={() => setView('login')}
          className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
        >
          Admin Access
        </button>
      )}
      {(view === 'admin' || isAdmin) && (
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      )}
    </div>
  </nav>
);

const UserView = ({
  formData,
  setFormData,
  handleReportSubmit,
  issues,
  isAILoading,
  handleAIRefine,
  isSubmitting,
  isLoading,
  apiKey
}) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [geoTagMessage, setGeoTagMessage] = useState('Upload a geotagged photo to auto-detect location.');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const extractGeoTag = async (file) => {
    try {
      const exifData = await exifr.parse(file, { gps: true });
      const latitude = exifData?.latitude;
      const longitude = exifData?.longitude;

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        const detectedLocation = [latitude, longitude];
        setFormData(prev => ({
          ...prev,
          image: file,
          location: detectedLocation,
          geoTagged: true,
          addressSearch: `Detected from photo: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        }));
        setGeoTagMessage(`Location auto-detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        return true;
      }
    } catch (error) {
      console.warn('EXIF read failed:', error);
    }

    setFormData(prev => ({ ...prev, image: file, geoTagged: false }));
    setGeoTagMessage('No geotag found in this photo. Please upload a geotagged photo.');
    return false;
  };

  useEffect(() => {
    if (!formData.image) {
      setPhotoPreview(null);
      return undefined;
    }

    const url = URL.createObjectURL(formData.image);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.image]);

  const handleFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraOn(false);
      await extractGeoTag(file);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported in this browser. Please use Upload Photo.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setIsCameraOn(true);
    } catch (error) {
      setCameraError('Unable to access camera. Please allow permission or use Upload Photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFormData(prev => ({
        ...prev,
        image: file,
        geoTagged: false,
        addressSearch: ''
      }));
      setGeoTagMessage('Captured image usually has no GPS geotag in browser camera mode. Upload a geotagged photo from device gallery.');
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const clearPhoto = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      geoTagged: false,
      location: VELLORE_CENTER,
      addressSearch: ''
    }));
    setGeoTagMessage('Upload a geotagged photo to auto-detect location.');
  };

  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    if (!isCameraOn || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {
      setCameraError('Camera preview could not start. Please try again.');
    });
  }, [isCameraOn]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-5">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-800">New Report</h2>
              <p className="text-slate-400 text-sm">Help improve our city by reporting issues.</p>
            </div>
            {apiKey && (
              <button 
                type="button"
                onClick={handleAIRefine}
                disabled={isAILoading || !formData.description}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                title="Refine with AI"
              >
                {isAILoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              </button>
            )}
          </header>

          <form onSubmit={handleReportSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Title</label>
              <input 
                type="text" 
                placeholder="Brief title of the issue"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-400 transition-all text-sm font-medium"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email ID</label>
              <input
                type="email"
                placeholder="yourname@example.com"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-400 transition-all text-sm font-medium"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Department</label>
              <select
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-400 transition-all text-sm font-medium"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Description</label>
              <textarea 
                rows="3"
                placeholder="What exactly is the problem?"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-400 transition-all text-sm font-medium resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                disabled={isSubmitting}
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Detected Location</label>
              <div className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-2">
                <Search size={14} className="text-blue-500" />
                {formData.geoTagged ? formData.addressSearch : 'Location will be auto-detected from photo geotag'}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Photo Evidence</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-700 transition-colors">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>
                {!isCameraOn ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-slate-700 text-white font-bold text-xs hover:bg-slate-800 transition-colors disabled:opacity-60"
                  >
                    Open Camera
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors disabled:opacity-60"
                    >
                      Stop Camera
                    </button>
                  </>
                )}
                {formData.image && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors disabled:opacity-60"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {cameraError && (
                <p className="text-xs font-bold text-red-500">{cameraError}</p>
              )}

              <p className={`text-xs font-bold ${formData.geoTagged ? 'text-emerald-600' : 'text-amber-600'}`}>
                {geoTagMessage}
              </p>

              {isCameraOn && (
                <div className="rounded-[1.25rem] border border-slate-200 overflow-hidden bg-slate-900">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-52 object-cover"
                  />
                </div>
              )}

              {photoPreview && (
                <div className="rounded-[1.25rem] border border-slate-200 overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="Photo preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="h-56 rounded-[1.5rem] border border-slate-200 overflow-hidden relative shadow-inner">
              <LeafletMap 
                location={formData.location} 
                readOnly={true}
              />
              <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-blue-600 shadow-lg">
                {formData.geoTagged ? `Pin from geotag: ${formData.location[0].toFixed(3)}, ${formData.location[1].toFixed(3)}` : 'Waiting for geotagged photo'}
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              {!isSubmitting && <PlusCircle size={20} />}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <BarChart3 size={24} className="text-blue-500" />
            Live Feed
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Updates
          </div>
        </div>

        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading issues...</p>
              </div>
            </div>
          ) : issues.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-slate-400 font-semibold">No issues reported yet</p>
            </div>
          ) : (
            issues.map(issue => (
              <div key={issue.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-50">
                  <img 
                    src={issue.image_path ? `${API_BASE}/${issue.image_path}` : 'https://images.unsplash.com/photo-1599411516024-420658f84439?auto=format&fit=crop&q=80&w=400'} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1599411516024-420658f84439?auto=format&fit=crop&q=80&w=400'}
                  />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate pr-4">{issue.title}</h3>
                    <StatusBadge status={issue.status} />
                  </div>
                  {issue.department && (
                    <div className="inline-flex mb-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {issue.department}
                    </div>
                  )}
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{issue.description}</p>
                  <div className="flex flex-wrap items-center gap-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-blue-400" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Navigation size={14} className="text-blue-400" />
                      {issue.latitude.toFixed(3)}, {issue.longitude.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ handleLogin, loginData, setLoginData, loginError, setView, isLoading }) => (
  <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-slate-50/50">
    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-white">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white text-center">
        <div className="bg-white/20 backdrop-blur-md w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-3xl font-black">Admin Access</h2>
        <p className="text-blue-100 text-sm mt-2 font-medium opacity-80">Login to manage city issues</p>
      </div>
      
      <form onSubmit={handleLogin} className="p-10 space-y-6">
        {loginError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3">
            <AlertCircle size={16} />
            {loginError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Username</label>
          <input 
            type="text" 
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-400 transition-all font-bold text-slate-700"
            placeholder="admin"
            value={loginData.username}
            onChange={e => setLoginData({...loginData, username: e.target.value})}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Security Key</label>
          <input 
            type="password" 
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-400 transition-all font-bold text-slate-700"
            placeholder="••••••••"
            value={loginData.password}
            onChange={e => setLoginData({...loginData, password: e.target.value})}
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] mt-4"
        >
          {isLoading ? 'Authenticating...' : 'Authenticate'}
        </button>
        
        <button 
          type="button"
          onClick={() => setView('user')}
          className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
        >
          Return to Dashboard
        </button>
      </form>
    </div>
  </div>
);

const IssueDetailModal = ({ issue, onClose, updateStatus, deleteIssue, token }) => {
  if (!issue) return null;

  const dateStr = new Date(issue.created_at || issue.timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const timeStr = new Date(issue.created_at || issue.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const imageUrl = issue.image_path ? `${API_BASE}/${issue.image_path}` : issue.image;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur shadow-lg rounded-full text-slate-400 hover:text-slate-800 transition-all hover:scale-110"
        >
          <X size={20} />
        </button>

        {/* Left: Image & Small Map */}
        <div className="w-full md:w-5/12 bg-slate-50 border-r border-slate-100">
          <div className="h-64 md:h-80 w-full overflow-hidden">
            <img 
              src={imageUrl || 'https://images.unsplash.com/photo-1599411516024-420658f84439?auto=format&fit=crop&q=80&w=400'} 
              className="w-full h-full object-cover" 
              alt="Report evidence"
              onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1599411516024-420658f84439?auto=format&fit=crop&q=80&w=400'}
            />
          </div>
          <div className="p-6">
            <div className="h-40 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
              <LeafletMap location={[issue.latitude, issue.longitude]} readOnly={true} />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 py-2 rounded-xl">
              <Navigation size={12} className="text-blue-500" />
              {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
            </div>
          </div>
        </div>

        {/* Right: Detailed Info */}
        <div className="w-full md:w-7/12 p-8 md:p-10">
          <header className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={issue.status} />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Report ID #{issue.id}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 leading-tight mb-2">{issue.title}</h2>
            {issue.department && (
              <div className="inline-flex mb-3 px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                {issue.department}
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" />
                {dateStr}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-blue-500" />
                {timeStr}
              </div>
            </div>
          </header>

          <div className="space-y-6">
            {issue.email && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reporter Email</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 text-sm font-semibold break-all">
                  {issue.email}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Citizen Description</h4>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {issue.description}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Take Action</h4>
                <select 
                  value={issue.status}
                  onChange={(e) => updateStatus(issue.id, e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs focus:ring-4 focus:ring-blue-500/10 cursor-pointer appearance-none outline-none"
                >
                  <option value="OPEN">Mark as Open</option>
                  <option value="IN_PROGRESS">Set to In Progress</option>
                  <option value="RESOLVED">Resolve Issue</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this issue permanently?')) {
                      deleteIssue(issue.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-3 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button 
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminView = ({ issues, updateStatus, handleAIAnalyze, analysisMap, analyzingId, onIssueClick, deleteIssue, token, isLoading }) => (
  <div className="max-w-7xl mx-auto p-6 md:p-10 animate-in slide-in-from-bottom-4 duration-700">
    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Management Console</h2>
        <p className="text-slate-500 font-medium">Resolution tracking for Vellore Smart City</p>
      </div>
      
      <div className="flex gap-4">
        <div className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center min-w-[100px]">
          <span className="text-2xl font-black text-slate-800">{issues.length}</span>
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Total</span>
        </div>
        <div className="bg-amber-50 px-6 py-4 rounded-[1.5rem] border border-amber-100 shadow-sm flex flex-col items-center min-w-[100px]">
          <span className="text-2xl font-black text-amber-600">{issues.filter(i => i.status === 'OPEN').length}</span>
          <span className="text-[9px] uppercase font-black text-amber-400 tracking-widest">Pending</span>
        </div>
        <div className="bg-emerald-50 px-6 py-4 rounded-[1.5rem] border border-emerald-100 shadow-sm flex flex-col items-center min-w-[100px]">
          <span className="text-2xl font-black text-emerald-600">{issues.filter(i => i.status === 'RESOLVED').length}</span>
          <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest">Fixed</span>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Loading data...</p>
          </div>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400 font-semibold">No issues to manage</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Issue Details</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {issues.map(issue => (
                <tr 
                  key={issue.id} 
                  onClick={() => onIssueClick(issue)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                        <img 
                          src={issue.image_path ? `${API_BASE}/${issue.image_path}` : 'https://images.unsplash.com/photo-1599411516024-420658f84439?auto=format&fit=crop&q=80&w=400'} 
                          className="w-full h-full object-cover" 
                          alt="" 
                          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1599411516024-420658f84439?auto=format&fit=crop&q=80&w=400'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-extrabold text-slate-800 text-base">{issue.title}</div>
                          {apiKey && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAIAnalyze(issue);
                              }}
                              disabled={analyzingId === issue.id}
                              className="text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
                              title="Get AI Recommendation"
                            >
                              {analyzingId === issue.id ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-medium truncate max-w-[200px] mt-0.5">{issue.description}</div>
                        {analysisMap[issue.id] && (
                          <div className="mt-2 p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-700 max-w-[250px] animate-in slide-in-from-top-1 duration-300">
                            ✨ {analysisMap[issue.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-400" />
                      {issue.latitude.toFixed(3)}, {issue.longitude.toFixed(3)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="p-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                        <Maximize2 size={16} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

// --- MAIN APP ENTRY ---

export default function App() {
  const apiKey = ''; // Set your Gemini API key here
  
  const [view, setView] = useState('user'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    email: '',
    department: '',
    description: '',
    location: VELLORE_CENTER,
    addressSearch: '',
    image: null,
    geoTagged: false
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [notification, setNotification] = useState(null);
  
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [analysisMap, setAnalysisMap] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);

  // Fetch issues on mount
  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE}/issues`);
      setIssues(response.data);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
      showNotification('Failed to load issues', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const response = await axios.post(`${API_BASE}/admin/login`, {
        username: loginData.username,
        password: loginData.password,
      });

      const accessToken = response.data.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      setIsAdmin(true);
      setView('admin');
      setLoginData({ username: '', password: '' });
      showNotification('Welcome, Administrator', 'success');
      fetchIssues();
    } catch (err) {
      setLoginError('Invalid credentials. Use: admin / admin');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setView('user');
    setToken('');
    localStorage.removeItem('token');
    showNotification('Logged out successfully', 'info');
    setLoginData({ username: '', password: '' });
    fetchIssues();
  };

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Vellore, Tamil Nadu')}&limit=5`);
      if (!response.ok) return;
      const data = await response.json();
      setAddressSuggestions(data || []);
    } catch (err) {
      console.warn("Geocoding service unavailable");
    }
  };

  const selectSuggestion = (sug) => {
    const coords = [parseFloat(sug.lat), parseFloat(sug.lon)];
    setFormData({ ...formData, location: coords, addressSearch: sug.display_name });
    setAddressSuggestions([]);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.email || !formData.department || !formData.description) {
      showNotification('Title, Email, Department and Description are required', 'error');
      return;
    }

    if (!formData.image) {
      showNotification('Please upload a photo to detect location', 'error');
      return;
    }

    if (!formData.geoTagged) {
      showNotification('Photo geotag location not found. Upload a geotagged photo.', 'error');
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!isValidEmail) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('department', formData.department);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('latitude', formData.location[0]);
      formDataToSend.append('longitude', formData.location[1]);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await axios.post(`${API_BASE}/issues`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ title: '', email: '', department: '', description: '', location: VELLORE_CENTER, addressSearch: '', image: null, geoTagged: false });
      showNotification('Issue reported successfully!', 'success');
      fetchIssues();
    } catch (err) {
      console.error('Failed to submit issue:', err);
      showNotification('Failed to submit issue. Try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE}/issues/${id}`, 
        { status: newStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      showNotification('Status updated successfully', 'success');
      fetchIssues();
    } catch (err) {
      console.error('Failed to update status:', err);
      showNotification('Failed to update status', 'error');
    }
  };

  const deleteIssue = async (id) => {
    if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE}/issues/${id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        showNotification('Issue deleted successfully', 'success');
        setSelectedIssue(null);
        fetchIssues();
      } catch (err) {
        console.error('Failed to delete issue:', err);
        showNotification('Failed to delete issue', 'error');
      }
    }
  };

  const handleAIRefine = async () => {
    if (!apiKey) {
      showNotification('AI key not configured', 'error');
      return;
    }
    
    if (!formData.description) {
      showNotification('Please enter a description first', 'error');
      return;
    }

    setIsAILoading(true);
    const prompt = `You are a professional incident report writer. Refine and enhance this citizen-reported issue description to be more clear, professional, and actionable:\n\n"${formData.description}"\n\nProvide only the improved description, no additional text.`;
    
    const refined = await callGemini(prompt);
    if (refined) {
      setFormData({ ...formData, description: refined });
      showNotification('Description refined with AI', 'success');
    } else {
      showNotification('AI refinement failed', 'error');
    }
    setIsAILoading(false);
  };

  const handleAIAnalyze = async (issue) => {
    if (!apiKey) return;
    if (analyzingId === issue.id) return;

    setAnalyzingId(issue.id);
    const prompt = `As a city administration expert, provide a brief 1-line recommendation for addressing this issue:\n\nTitle: ${issue.title}\nDescription: ${issue.description}\nLocation: ${issue.latitude}, ${issue.longitude}\n\nProvide only the actionable recommendation.`;
    
    const recommendation = await callGemini(prompt);
    if (recommendation) {
      setAnalysisMap({ ...analysisMap, [issue.id]: recommendation.substring(0, 120) });
    }
    setAnalyzingId(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      <Navbar setView={setView} view={view} isAdmin={isAdmin} handleLogout={handleLogout} />
      
      <main>
        {view === 'user' && (
          <UserView 
            formData={formData} 
            setFormData={setFormData} 
            searchAddress={searchAddress} 
            addressSuggestions={addressSuggestions} 
            selectSuggestion={selectSuggestion} 
            handleReportSubmit={handleReportSubmit} 
            issues={issues}
            isLoading={isLoading}
            isAILoading={isAILoading}
            handleAIRefine={handleAIRefine}
            apiKey={apiKey}
            isSubmitting={isSubmitting}
          />
        )}
        {view === 'login' && (
          <LoginView 
            handleLogin={handleLogin} 
            loginData={loginData} 
            setLoginData={setLoginData} 
            loginError={loginError} 
            setView={setView}
            isLoading={isLoading}
          />
        )}
        {view === 'admin' && (
          <AdminView 
            issues={issues} 
            updateStatus={updateStatus}
            deleteIssue={deleteIssue}
            isLoading={isLoading}
            token={token}
            handleAIAnalyze={handleAIAnalyze}
            analysisMap={analysisMap}
            analyzingId={analyzingId}
            onIssueClick={setSelectedIssue}
            apiKey={apiKey}
          />
        )}
      </main>

      {selectedIssue && (
        <IssueDetailModal 
          issue={selectedIssue} 
          onClose={() => setSelectedIssue(null)} 
          updateStatus={updateStatus} 
          deleteIssue={deleteIssue}
          token={token}
        />
      )}

      {notification && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] px-8 py-4 rounded-2xl text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-600'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-black text-sm uppercase tracking-wider">{notification.message}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
}
