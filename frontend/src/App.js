import { Routes, Route, Link } from "react-router-dom";
import UserPage from "./pages/UserPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>SmartVellore – Civic Issues</h1>

      {/* Top Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>
          <button>User</button>
        </Link>

        <Link to="/admin/login">
          <button>Admin</button>
        </Link>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<UserPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
