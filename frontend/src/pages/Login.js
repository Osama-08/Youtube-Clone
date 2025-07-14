import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/v1/users/login",
        form,
        { withCredentials: true }
      );
      setLoading(false);
      setSuccess(res.data.message || "Logged in successfully!");
      // Optionally, redirect after a short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="container">
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Sign In</h2>
      {success && <div style={{ color: '#388e3c', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username or Email"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        Don't have an account?{' '}
        <Link to="/register" className="link">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Login; 