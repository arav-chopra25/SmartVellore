import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const fetchIssues = async () => {
  const res = await axios.get(`${API_BASE}/issues/all`);
  return res.data;
};

export const submitIssue = async (formData) => {
  const res = await axios.post(
    `${API_BASE}/issues/create`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const updateIssueStatus = async (id, status) => {
  const res = await axios.put(
    `${API_BASE}/issues/${id}/status`,
    { status }
  );
  return res.data;
};

export const adminLogin = async (username, password) => {
  // simple demo login (no JWT yet)
  if (username === "admin" && password === "admin123") {
    return { success: true };
  }
  throw new Error("Invalid credentials");
};
