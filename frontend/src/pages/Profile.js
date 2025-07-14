import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000";

const getFullUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}/${path.replace(/^public[\\/]/, "")}`;
};

const getFileType = (filePath) => {
  if (!filePath) return "";
  const ext = filePath.split('.').pop().toLowerCase();
  if (["mp4", "webm", "ogg"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "image";
  return "";
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState({ fullname: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const avatarInputRef = useRef();
  const coverInputRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // 1. Get current user info
        const res = await axios.get("/api/v1/users/current-user", { withCredentials: true });
        setUser(res.data.data);
        setEditForm({ fullname: res.data.data.fullname, email: res.data.data.email });
        // 2. Get channel info (subscriber count, etc.)
        if (res.data.data.username) {
          const channelRes = await axios.get(`/api/v1/users/c/${res.data.data.username}`, { withCredentials: true });
          setChannel(channelRes.data.data);
        }
        // 3. Get all videos (filter by owner)
        const videosRes = await axios.get("/api/v1/videos");
        setVideos(videosRes.data.data.filter(v => v.owner?._id === res.data.data._id));
        setLoading(false);
      } catch (err) {
        setError("Failed to load profile");
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      // Update fullname/email
      await axios.patch("/api/v1/users/update-account", editForm, { withCredentials: true });
      // Update avatar
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        await axios.patch("/api/v1/users/avatar", formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      }
      // Update cover image
      if (coverFile) {
        const formData = new FormData();
        formData.append("coverImage", coverFile);
        await axios.patch("/api/v1/users/cover-Image", formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      }
      setEditSuccess("Profile updated successfully!");
      setTimeout(() => { setShowEdit(false); window.location.reload(); }, 1200);
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update profile");
    }
    setEditLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await axios.post("/api/v1/users/change-password", passwordForm, { withCredentials: true });
      setPasswordSuccess("Password changed successfully!");
      setTimeout(() => { setShowPassword(false); setPasswordForm({ currentPassword: "", newPassword: "" }); }, 1200);
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    }
    setPasswordLoading(false);
  };

  const handleWatchHistory = async () => {
    setShowHistory(true);
    try {
      const res = await axios.get("/api/v1/users/watch-history", { withCredentials: true });
      setHistory(res.data.data || []);
    } catch (err) {
      setHistory([]);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div style={{ color: '#d32f2f' }}>{error}</div>;
  if (!user) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Cover Image */}
      <div style={{ position: 'relative', height: 180, background: '#222', borderRadius: 12, marginBottom: 60, overflow: 'hidden' }}>
        {user.coverImage && (
          <img src={getFullUrl(user.coverImage)} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {/* Avatar */}
        <img
          src={getFullUrl(user.avatar)}
          alt="avatar"
          style={{
            position: 'absolute',
            left: 32,
            bottom: -48,
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '5px solid #fff',
            objectFit: 'cover',
            background: '#eee',
          }}
        />
      </div>
      {/* User Info */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 32 }}>
        <div style={{ marginLeft: 160 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{user.username}</div>
          <div style={{ fontSize: 18, color: '#555' }}>{user.fullname}</div>
          <div style={{ fontSize: 15, color: '#888', marginTop: 2 }}>{user.email}</div>
          <div style={{ fontSize: 15, color: '#007bff', marginTop: 2 }}>{channel?.subcribersCount || 0} subscribers</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <button onClick={() => setShowEdit(true)} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#007bff', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Edit Profile</button>
          <button onClick={() => setShowPassword(true)} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#cc0000', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Change Password</button>
          <button onClick={handleWatchHistory} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#eee', color: '#222', fontWeight: 600, cursor: 'pointer' }}>Watch History</button>
        </div>
      </div>
      {/* User's Videos */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 16 }}>Your Videos</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {videos.length === 0 && <div>No videos uploaded yet.</div>}
          {videos.map((video) => {
            const fileType = getFileType(video.videoFile);
            const fileUrl = getFullUrl(video.videoFile);
            return (
              <div key={video._id} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 16, maxWidth: 300 }}>
                {fileType === "video" && (
                  <video src={fileUrl} controls style={{ width: '100%', borderRadius: 6, marginBottom: 8 }} />
                )}
                {fileType === "image" && (
                  <img src={fileUrl} alt={video.title} style={{ width: '100%', borderRadius: 6, marginBottom: 8 }} />
                )}
                <h3 style={{ margin: '8px 0' }}>{video.title}</h3>
                <div style={{ fontSize: 14, color: '#555' }}>{video.description}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Uploaded: {new Date(video.createdAt).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Edit Profile Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 350 }}>
            <h3>Edit Profile</h3>
            <form onSubmit={handleEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="text" value={editForm.fullname} onChange={e => setEditForm(f => ({ ...f, fullname: e.target.value }))} placeholder="Full Name" required />
              <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" required />
              <div>
                <label>Avatar: </label>
                <input type="file" accept="image/*" ref={avatarInputRef} onChange={e => setAvatarFile(e.target.files[0])} />
              </div>
              <div>
                <label>Cover Image: </label>
                <input type="file" accept="image/*" ref={coverInputRef} onChange={e => setCoverFile(e.target.files[0])} />
              </div>
              {editError && <div style={{ color: '#d32f2f' }}>{editError}</div>}
              {editSuccess && <div style={{ color: '#388e3c' }}>{editSuccess}</div>}
              <button type="submit" disabled={editLoading} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#007bff', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setShowEdit(false)} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#eee', color: '#222', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showPassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 350 }}>
            <h3>Change Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Current Password" required />
              <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="New Password" required />
              {passwordError && <div style={{ color: '#d32f2f' }}>{passwordError}</div>}
              {passwordSuccess && <div style={{ color: '#388e3c' }}>{passwordSuccess}</div>}
              <button type="submit" disabled={passwordLoading} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#cc0000', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{passwordLoading ? 'Saving...' : 'Change Password'}</button>
              <button type="button" onClick={() => setShowPassword(false)} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#eee', color: '#222', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
      {/* Watch History Modal */}
      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 350, maxWidth: 700 }}>
            <h3>Watch History</h3>
            <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 16 }}>
              {history.length === 0 && <div>No watch history found.</div>}
              {history.map((video) => (
                <div key={video._id} style={{ background: '#f4f4f4', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <img src={getFullUrl(video.videoFile)} alt={video.title} style={{ width: 80, borderRadius: 6, marginRight: 12, float: 'left' }} />
                  <div style={{ marginLeft: 100 }}>
                    <div style={{ fontWeight: 600 }}>{video.title}</div>
                    <div style={{ fontSize: 13 }}>{video.description}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Watched: {new Date(video.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ clear: 'both' }}></div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHistory(false)} style={{ marginTop: 24, padding: '8px 20px', borderRadius: 20, border: 'none', background: '#007bff', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 