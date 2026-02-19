import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const fetchIssues = async () => {
  const res = await API.get("/issues");
  return res.data;
};

export const submitIssue = async (formData) => {
  const res = await API.post("/issues", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const adminLogin = async (credentials) => {
  const res = await API.post("/admin/login", credentials);
  return res.data;
};

export const updateIssueStatus = async (id, status) => {
  const res = await API.put(`/issues/${id}`, { status });
  return res.data;
};
