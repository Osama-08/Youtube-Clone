import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Comments in-memory for demo (replace with DB in production)
const commentsStore = {};

// Upload a new video
export const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.file?.path;
  const thumbnail = req.body.thumbnail || "";
  const owner = req.user?._id;

  if (!title || !description || !videoFile) {
    throw new ApiError(400, "Title, description, and video file are required");
  }

  const video = await Video.create({
    title,
    description,
    videoFile,
    thumbnail,
    owner,
  });

  return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
});

// List all videos
export const listVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find().populate("owner", "username avatar").sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// Get a single video by ID
export const getVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate("owner", "username avatar");
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

// Increment video views
export const incrementViews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await Video.findByIdAndUpdate(id, { $inc: { Views: 1 } }, { new: true });
  if (!video) throw new ApiError(404, "Video not found");
  return res.status(200).json(new ApiResponse(200, { Views: video.Views }, "View count updated"));
});

// Get comments for a video
export const getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comments = commentsStore[id] || [];
  return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// Add a comment to a video
export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) throw new ApiError(400, "Comment text is required");
  const comment = { text, user: req.user?.username || "Anonymous", date: new Date() };
  if (!commentsStore[id]) commentsStore[id] = [];
  commentsStore[id].unshift(comment);
  return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
}); 