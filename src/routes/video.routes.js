import { Router } from "express";
import { uploadVideo, listVideos, getVideo, incrementViews, getComments, addComment } from "../controllers/video_controller.js";
import { upload } from "../middelware/multer.middelware.js";
import { verifyJWT } from "../middelware/auth.middleware.js";

const router = Router();

// List all videos
router.get("/", listVideos);

// Upload a new video (authenticated, with file upload)
router.post("/upload", verifyJWT, upload.single("videoFile"), uploadVideo);

// Get a single video by ID
router.get("/:id", getVideo);

// Increment views
router.patch("/:id/views", incrementViews);
// Comments
router.get("/:id/comments", getComments);
router.post("/:id/comments", verifyJWT, addComment);

export default router; 