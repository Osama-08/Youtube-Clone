import { Router } from "express";
import { loginUser, logoutUser, registerUser ,refreshAccessToken} from "../controllers/user_controller.js";
import { upload } from "../middelware/multer.middelware.js";
import {  verifyJWT } from "../middelware/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)



//secured routes

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-Token").post(refreshAccessToken)
export default router;
