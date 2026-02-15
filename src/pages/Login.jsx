import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const { login } = useAuth();

  const [mode, setMode] = useState(null); // "student" | "coordinator" | "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profile, setProfile] = useState({ name: "", rollNo: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const doRedirect = (role) => {
    if (redirect && redirect.startsWith("/")) {
      navigate(redirect, { replace: true });
      return;
    }
    if (role === "student") navigate("/student", { replace: true });
    else if (role === "coordinator") navigate("/coordinator", { replace: true });
    else navigate("/admin", { replace: true });
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const result = await Promise.resolve(login("student", email.trim(), null));
      if (result?.ok) {
        doRedirect("student");
        return;
      }
      if (result?.needsProfile) {
        setNeedsProfile(true);
        setMessage("First time here? Enter your details below.");
        return;
      }
      setMessage(result?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinatorSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const result = await Promise.resolve(login("coordinator", email.trim(), password));
      if (result?.ok) {
        doRedirect("coordinator");
        return;
      }
      setMessage(result?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const result = await Promise.resolve(login("admin", email.trim(), password));
      if (result?.ok) {
        doRedirect("admin");
        return;
      }
      setMessage(result?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const result = await Promise.resolve(login("student", email.trim(), null, profile));
      if (result?.ok) {
        doRedirect("student");
        return;
      }
      setMessage(result?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resetMode = () => {
    setMode(null);
    setEmail("");
    setPassword("");
    setMessage("");
    setNeedsProfile(false);
    setProfile({ name: "", rollNo: "", phone: "" });
  };

  return (
    <div className="login-page">
      <div className="login-card card-effect">
        <h1 className="login-title">Leo Club of CEG</h1>
        <p className="login-subtitle">Choose how you want to sign in</p>

        {!mode && (
          <div className="login-role-buttons">
            <button type="button" className="login-role-btn student-btn" onClick={() => setMode("student")}>
              Student
            </button>
            <button type="button" className="login-role-btn coord-btn" onClick={() => setMode("coordinator")}>
              Coordinator
            </button>
            <button type="button" className="login-role-btn admin-btn" onClick={() => setMode("admin")}>
              Admin
            </button>
          </div>
        )}

        {mode === "student" && !needsProfile && (
          <form onSubmit={handleStudentSubmit} className="login-form">
            <h2 className="login-form-title">Student — Enter email</h2>
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            {message && <p className="login-message">{message}</p>}
            <div className="login-form-actions">
              <button type="submit" className="login-btn student-btn" disabled={loading}>{loading ? "Please wait…" : "Continue"}</button>
              <button type="button" className="login-back" onClick={resetMode}>Back</button>
            </div>
          </form>
        )}

        {mode === "student" && needsProfile && (
          <form onSubmit={handleProfileSubmit} className="login-form">
            <h2 className="login-form-title">New student — Complete profile</h2>
            <p className="login-info">{message}</p>
            <label className="login-label">Name</label>
            <input
              type="text"
              className="login-input"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              required
            />
            <label className="login-label">Roll No</label>
            <input
              type="text"
              className="login-input"
              value={profile.rollNo}
              onChange={(e) => setProfile((p) => ({ ...p, rollNo: e.target.value }))}
              placeholder="e.g. CEG2024001"
              required
            />
            <label className="login-label">Phone</label>
            <input
              type="tel"
              className="login-input"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="10-digit mobile"
              required
            />
            <div className="login-form-actions">
              <button type="submit" className="login-btn student-btn" disabled={loading}>{loading ? "Please wait…" : "Create profile & Continue"}</button>
              <button type="button" className="login-back" onClick={() => setNeedsProfile(false)}>Back</button>
            </div>
          </form>
        )}

        {mode === "coordinator" && (
          <form onSubmit={handleCoordinatorSubmit} className="login-form">
            <h2 className="login-form-title">Coordinator — Sign in</h2>
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coordinator@email.com"
              required
            />
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {message && <p className="login-message">{message}</p>}
            <div className="login-form-actions">
              <button type="submit" className="login-btn coord-btn" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
              <button type="button" className="login-back" onClick={resetMode}>Back</button>
            </div>
          </form>
        )}

        {mode === "admin" && (
          <form onSubmit={handleAdminSubmit} className="login-form">
            <h2 className="login-form-title">Admin — Sign in</h2>
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              required
            />
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {message && <p className="login-message">{message}</p>}
            <div className="login-form-actions">
              <button type="submit" className="login-btn admin-btn" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
              <button type="button" className="login-back" onClick={resetMode}>Back</button>
            </div>
          </form>
        )}

        <p className="login-hint">
          Sample: student@test.com (no password) · coord@test.com / admin@test.com — password: password
        </p>
      </div>
    </div>
  );
}
