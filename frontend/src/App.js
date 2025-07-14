import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import VideoPlayer from "./pages/VideoPlayer";
import Profile from "./pages/Profile";

// Main layout and placeholder pages
const MainLayout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <nav style={{ width: 220, background: '#222', color: '#fff', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ color: '#61dafb', marginBottom: 32 }}>YouTube Clone</h2>
      <a href="/app/home" style={{ color: '#fff', textDecoration: 'none', marginBottom: 12 }}>Home</a>
      <a href="/app/profile" style={{ color: '#fff', textDecoration: 'none', marginBottom: 12 }}>Profile</a>
      <a href="/app/logout" style={{ color: '#fff', textDecoration: 'none', marginTop: 'auto' }}>Logout</a>
    </nav>
    <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
  </div>
);

const Logout = () => {
  window.location.href = "/login";
  return null;
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app/*" element={
        <MainLayout>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="logout" element={<Logout />} />
            <Route path="video/:id" element={<VideoPlayer />} />
            <Route path="*" element={<Navigate to="home" />} />
          </Routes>
        </MainLayout>
      } />
      <Route path="/" element={<Navigate to="/app/home" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  </Router>
);

export default App;
