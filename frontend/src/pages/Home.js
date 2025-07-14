import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:8000";

const getFullUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // Remove leading 'public/' if present
  return `${BACKEND_URL}/${path.replace(/^public[\\/]/, "")}`;
};

const getFileType = (filePath) => {
  if (!filePath) return "";
  const ext = filePath.split('.').pop().toLowerCase();
  if (["mp4", "webm", "ogg"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "image";
  return "";
};

const VideoCard = ({ video }) => {
  const navigate = useNavigate();
  const fileType = getFileType(video.videoFile);
  const fileUrl = getFullUrl(video.videoFile);

  const handleClick = () => {
    navigate(`/app/video/${video._id}`);
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: 16,
        marginBottom: 24,
        maxWidth: 350,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onClick={handleClick}
      title={video.title}
    >
      {fileType === "video" && (
        <video
          src={fileUrl}
          controls
          style={{ width: '100%', borderRadius: 6, marginBottom: 8 }}
          onClick={e => e.stopPropagation()} // prevent video controls from triggering navigation
        />
      )}
      {fileType === "image" && (
        <img
          src={fileUrl}
          alt={video.title}
          style={{ width: '100%', borderRadius: 6, marginBottom: 8 }}
        />
      )}
      <h3 style={{ margin: '8px 0' }}>{video.title}</h3>
      <div style={{ fontSize: 14, color: '#555' }}>
        By: {video.owner?.username || 'Unknown'}
      </div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
        Uploaded: {new Date(video.createdAt).toLocaleString()}
      </div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', marginTop: 12, color: '#007bff' }}
        onClick={e => e.stopPropagation()}
      >
        Watch Video
      </a>
    </div>
  );
};

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/v1/videos");
        setVideos(res.data.data || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load videos");
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <div>Loading videos...</div>;
  if (error) return <div style={{ color: '#d32f2f' }}>{error}</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Video Feed</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {videos.length === 0 && <div>No videos found.</div>}
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default Home; 