import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    const ok = await adminLogin(username, password);
    if (ok) navigate("/admin/dashboard");
    else alert("Invalid credentials");
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Admin Login</h2>
      <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <br /><br />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
