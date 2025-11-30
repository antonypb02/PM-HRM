import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

// ======= CONFIG =======
const API_BASE = "http://localhost:5000"; // Flask backend
const DIAGRAM_URL = "/mnt/data/Untitled diagram-2025-11-21-043259.png"; // ===== NOTE: local uploaded file path =====

// ======= Auth Helpers =======
const saveToken = (token) => localStorage.setItem("auth_token", token);
const getToken = () => localStorage.getItem("auth_token");
const removeToken = () => localStorage.removeItem("auth_token");

// ======= Protected Route =======
function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// ======= API Service =======
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// ======= Login Page =======
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) navigate("/");
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      const token = data.token;
      saveToken(token);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div style={styles.pageCenter}>
      <div style={styles.card}>
        <h2 style={{ marginBottom: 8 }}>Construction Hub — Login</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button type="submit" style={styles.primaryBtn}>Sign In</button>
          {error && <div style={styles.error}>{error}</div>}
        </form>
        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          Use any registered user from the Flask backend.
        </div>
      </div>
    </div>
  );
}

// ======= Sidebar (Construction Theme) =======
function Sidebar({ onLogout, role }) {
  return (
    <div style={styles.sidebar}>
      <div style={{padding:12}}>
        <img src={DIAGRAM_URL} alt="diagram" style={{ width: 200, height: 60, objectFit: "contain", marginBottom: 8 }} />
        <div style={{fontWeight:700, marginBottom:12}}>Construction Hub</div>
      </div>
      <NavItem to="/" label="Dashboard" />
      <NavItem to="/projects" label="Projects" />
      <NavItem to="/tasks" label="Tasks" />
      <NavItem to="/inventory" label="Inventory" />
      <NavItem to="/qc" label="Quality Control" />
      <NavItem to="/attendance" label="Attendance" />

      <div style={{ marginTop: "auto", padding: 12 }}>
        <div style={{ fontSize: 12, color: "#999" }}>Role: <strong>{role || "Guest"}</strong></div>
        <button onClick={onLogout} style={{...styles.primaryBtn, marginTop:8, width: "100%"}}>Logout</button>
      </div>
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <a href={to} style={styles.navItem} onClick={(e)=>{ e.preventDefault(); window.location.pathname = to;}}>{label}</a>
  );
}

// ======= Dashboard Widgets =======
function DashboardHome() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const projects = await api.get("/projects");
        const tasks = await api.get("/tasks");
        setStats({ projects: projects.data.length, tasks: tasks.data.length });
      } catch (err) {
        setStats({ projects: 0, tasks: 0 });
      }
    };
    fetch();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Dashboard</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard title="Active Projects" value={stats?.projects ?? "--"} />
        <StatCard title="Open Tasks" value={stats?.tasks ?? "--"} />
        <StatCard title="Site Progress" value="72%" />
      </div>

      <section style={{ marginTop: 18 }}>
        <h3>Recent Activity</h3>
        <div style={styles.listCard}>
          <div style={{ padding: 12 }}>No recent events — this panel will show site updates, QA reports and inventory movements.</div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// ======= Simple Pages for Nav Links =======
function Placeholder({ title }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>{title}</h2>
      <div style={styles.listCard}>Content for {title} will be here.</div>
    </div>
  );
}

// ======= Main App Layout =======
function AppLayout() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // decode role from token if exists — token payload structure depends on backend
    const token = getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role);
    } catch (e) {
      setRole(null);
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
    window.location.reload();
  };

  return (
    <div style={styles.appWrap}>
      <Sidebar onLogout={handleLogout} role={role} />
      <div style={styles.contentArea}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/projects" element={<Placeholder title="Projects" />} />
          <Route path="/tasks" element={<Placeholder title="Tasks" />} />
          <Route path="/inventory" element={<Placeholder title="Inventory" />} />
          <Route path="/qc" element={<Placeholder title="Quality Control" />} />
          <Route path="/attendance" element={<Placeholder title="Attendance" />} />
        </Routes>
      </div>
    </div>
  );
}

// ======= Root App =======
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

// ======= Styles =======
const styles = {
  pageCenter: { display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f5f7fb" },
  card: { width: 360, padding: 18, borderRadius: 8, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ddd", outline: "none" },
  primaryBtn: { padding: 10, borderRadius: 6, background: "#1e90ff", color: "white", border: "none", cursor: "pointer" },
  error: { color: "#b00020", marginTop: 6 },

  appWrap: { display: "flex", minHeight: "100vh", background: "#eef2f6" },
  sidebar: { width: 240, background: "#0f1724", color: "white", display: "flex", flexDirection: "column", paddingTop: 12, minHeight: "100vh" },
  contentArea: { flex: 1, background: "#f7fafc" },
  navItem: { display: "block", padding: "10px 16px", color: "#cbd5e1", textDecoration: "none", fontSize: 14 },
  statCard: { background: "#fff", padding: 16, borderRadius: 8, minWidth: 160, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" },
  listCard: { marginTop: 8, background: "#fff", padding: 8, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }
};

