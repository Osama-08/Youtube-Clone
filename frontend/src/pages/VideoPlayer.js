import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000";

const getFullUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}/${path.replace(/^public[\\/]/, "")}`;
};

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState(0);
  const [likeStatus, setLikeStatus] = useState(null); // 'like', 'dislike', or null
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [views, setViews] = useState(0);

  // Fetch video details, increment views, fetch comments, fetch channel info
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // 1. Fetch video
        const res = await axios.get(`/api/v1/videos/${id}`);
        setVideo(res.data.data);
        setViews(res.data.data.Views || 0);
        // 2. Increment views
        await axios.patch(`/api/v1/videos/${id}/views`);
        // 3. Fetch comments
        const commentsRes = await axios.get(`/api/v1/videos/${id}/comments`);
        setComments(commentsRes.data.data || []);
        // 4. Fetch channel info (subscription status/count)
        if (res.data.data.owner?.username) {
          const channelRes = await axios.get(`/api/v1/users/c/${res.data.data.owner.username}`);
          setSubscribed(channelRes.data.data.isSubscribed);
          setSubscribers(channelRes.data.data.subcribersCount);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load video");
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line
  }, [id]);

  const handleSubscribe = async () => {
    if (!video?.owner?._id) return;
    try {
      if (subscribed) {
        const res = await axios.post(
          "/api/v1/users/unsubscribe",
          { channelId: video.owner._id },
          { withCredentials: true }
        );
        setSubscribed(false);
        setSubscribers(res.data.data.subcribersCount);
      } else {
        const res = await axios.post(
          "/api/v1/users/subscribe",
          { channelId: video.owner._id },
          { withCredentials: true }
        );
        setSubscribed(true);
        setSubscribers(res.data.data.subcribersCount);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update subscription");
    }
  };

  const handleLike = () => {
    setLikeStatus(likeStatus === "like" ? null : "like");
    // Placeholder: Call backend to like
  };

  const handleDislike = () => {
    setLikeStatus(likeStatus === "dislike" ? null : "dislike");
    // Placeholder: Call backend to dislike
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (comment.trim()) {
      try {
        const res = await axios.post(
          `/api/v1/videos/${id}/comments`,
          { text: comment },
          { withCredentials: true }
        );
        setComments([res.data.data, ...comments]);
        setComment("");
      } catch (err) {
        alert(err.response?.data?.message || "Failed to add comment");
      }
    }
  };

  if (loading) return <div>Loading video...</div>;
  if (error) return <div style={{ color: '#d32f2f' }}>{error}</div>;
  if (!video) return null;

  const fileType = video.videoFile?.split('.').pop().toLowerCase();
  const isVideo = ["mp4", "webm", "ogg"].includes(fileType);
  const fileUrl = getFullUrl(video.videoFile);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, display: 'flex', gap: 32 }}>
      <div style={{ flex: 2 }}>
        <div style={{ background: '#000', borderRadius: 8, marginBottom: 16 }}>
          {isVideo ? (
            <video src={fileUrl} controls style={{ width: '100%', borderRadius: 8, background: '#000' }} />
          ) : (
            <img src={fileUrl} alt={video.title} style={{ width: '100%', borderRadius: 8 }} />
          )}
        </div>
        <h2 style={{ margin: '16px 0 8px 0' }}>{video.title}</h2>
        <div style={{ color: '#555', marginBottom: 8 }}>{video.description}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <img src={video.owner?.avatar ? getFullUrl(video.owner.avatar) : undefined} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#eee' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{video.owner?.username || 'Unknown'}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Published: {new Date(video.createdAt).toLocaleDateString()}</div>
            <div style={{ fontSize: 13, color: '#007bff', marginTop: 2 }}>{subscribers} subscribers</div>
          </div>
          <button
            onClick={handleSubscribe}
            style={{ marginLeft: 24, padding: '8px 20px', background: subscribed ? '#aaa' : '#cc0000', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}
          >
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <span style={{ fontSize: 15, color: '#888' }}>{views} views</span>
          <button onClick={handleLike} style={{ background: likeStatus === 'like' ? '#007bff' : '#eee', color: likeStatus === 'like' ? '#fff' : '#222', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer' }}>👍 Like</button>
          <button onClick={handleDislike} style={{ background: likeStatus === 'dislike' ? '#007bff' : '#eee', color: likeStatus === 'dislike' ? '#fff' : '#222', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer' }}>👎 Dislike</button>
          <button onClick={handleShare} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer' }}>🔗 Share</button>
        </div>
        <form onSubmit={handleComment} style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..."
            style={{ width: '70%', padding: 10, borderRadius: 20, border: '1px solid #ccc', marginRight: 8 }}
          />
          <button type="submit" style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#007bff', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Comment</button>
        </form>
        <div>
          {comments.length === 0 && <div style={{ color: '#888' }}>No comments yet.</div>}
          {comments.map((c, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 12, background: '#f4f4f4', borderRadius: 8 }}>
              <div style={{ fontWeight: 600 }}>{c.user}</div>
              <div style={{ fontSize: 13 }}>{c.text}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{new Date(c.date).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Placeholder for related videos or sidebar */}
      <div style={{ flex: 1, minWidth: 250 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: 12 }}>Related Videos</h3>
          <div style={{ color: '#888' }}>(Coming soon)</div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer; 