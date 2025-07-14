import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {User} from "../models/user.model.js"
import {uploadonCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { mongo } from 'mongoose';
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";
const generateAccessAndRefreshTokens = async(userId) => {
    try{
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
   await user.save({validateBeforeSave: false});
    return { accessToken, refreshToken };
    }catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
   
}

const registerUser=asyncHandler(async (req, res) => {
       //get data from frontend
       //validation -not emply
     //check if user already exists-->username or email
     //check for images check for avatar
     //upload in the cloudinary,avatar
    //create user object in the database
    //remove password from the user object and refresh
    //check for user connection
    //return response to the frontend

    const {fullname,username,email,password}=req.body
    //console.log("User Data:", fullname, username, email, password);
    if([fullname,username,email,password].some(field => field?.trim()==="")){
      throw new ApiError(400, "All fields are required");
    }

    const existingUser=await User.findOne({$or:[{username},{email}]})
    if(existingUser){
        throw new ApiError(409, "Username or Email already exists");
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar=await uploadonCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar");
    }
    const coverImage=coverImageLocalPath?await uploadonCloudinary(coverImageLocalPath):null;

  const user=await User.create({
        fullname,
        username,
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || null
    });

    const createdUser=await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }

   return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));

})


/*const loginUser = asyncHandler(async (req, res) => {
    // TODO: Implement login logic here
     // get data from frontend(req body)
     //username or email
     //find user in the database
    //check if user exists
    //check if password is correct
    //generate access token and refresh token
    //send cookies
    const {username,email, password} = req.body;
    if((!username &&!email) || !password){
        throw new ApiError(400, "Username or Email and Password are required");
    }
   
   const user=await  User.findOne({$or:[{username},{email}]});
        if(!user){
            throw new ApiError(404, "User not found");
        }
        const isPasswordValid=await user.isPasswordCorrect(password);
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid password");
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        res.cookie("accessToken",accessToken,{
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge:1000*60*15 //15 minutes
        });
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge:1000*60*60*24*30 //30 days
        });

        return res.status(200).json(new ApiResponse(200, {user}, "User logged in successfully"));


})*/

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Build query only with non-empty fields
    const query = [];
    if (username && username.trim() !== "") query.push({ username });
    if (email && email.trim() !== "") query.push({ email });

    if (!query.length || !password) {
        throw new ApiError(400, "Username or Email and Password are required");
    }

    const user = await User.findOne({ $or: query });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // ✅ change to true in production
        sameSite: "lax", // ✅ better compatibility for dev
        maxAge: 1000 * 60 * 15
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30
    });

    user.password = undefined;
    user.refreshToken = undefined;

    // Send a clear message for frontend display
    return res.status(200).json({
        success: true,
        message: "User logged in successfully!",
        user
    });
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set:{refreshToken:undefined} }, { new: true })
    .then(() => {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });
        return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
    })
})

const  refreshAccessToken = asyncHandler(async (req, res) => {
     const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");}
     try{
const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
     
    const user= User.findById(decodedToken._id);
     if (!user) {
        throw new ApiError(401, "Invalid refresh token");}
    
        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token cookie(expired or tampered)");
        }

    const {newAccessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id);

    return res
    .status(200)
    .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 15 // 15 minutes
    })
    .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    })
    .json(new ApiResponse(200, { user }, "Access token refreshed successfully")); 

     }   
     catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid current password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));

})


const getCurrentUser = asyncHandler(async (req, res) => {
   return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));

})

const UpdateAccountDetails = asyncHandler(async (req, res) => {
    
    const { fullname, username, email } = req.body;
    if ([fullname, username, email].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                 fullname,
                email: email,
                 }
        },
        {
            new: true
        }


    ).select("-password");
 

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));


})

const updateUserAvatar = asyncHandler(async (req, res) => {
    // Support both multer single and fields
    const avatarLocalPath = req.files?.avatar?.[0]?.path || req.file?.path;
    if (!avatarLocalPath) {
        // No avatar uploaded, skip update
        return res.status(200).json(new ApiResponse(200, null, "No avatar uploaded, nothing to update"));
    }
    const avatar = await uploadonCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");
    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path || req.file?.path;
    if (!coverImageLocalPath) {
        // No cover image uploaded, skip update
        return res.status(200).json(new ApiResponse(200, null, "No cover image uploaded, nothing to update"));
    }
    const coverImage = await uploadonCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(500, "Failed to upload CoverImage");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");
    return res.status(200).json(new ApiResponse(200, user, "CoverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
      const {username}=req.params;
        if(!username?.trim()){
            throw new ApiError(400, "Username is required");}
        
       const channel=await User.aggregate([
            { $match: { username:username?.toLowerCase() } },
            {
                $lookup: {
                    from: "Subscriptions", 
                    localField: "_id",
                    foreignField: "channel",
                    as: "subcribers"
                }
            },
            {
                $lookup: {
                    from: "Subscriptions", 
                    localField: "_id",
                    foreignField: "subcriber",
                    as: "subcribedTo"
                }
            },
            {
                $addFields:{
                    subcribersCount: { $size: "$subcribers" },
                    channelsubcribedToCount: { $size: "$subcribedTo" },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subcribers.subcriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    email:1,
                    subcribersCount: 1,
                    channelsubcribedToCount: 1,
                    isSubscribed: 1
                }
            }
        ])
        if(!channel?.length){
            throw new ApiError(404, "Channel not found");
        } 
        return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully")); 


})


const getWatchHistory = asyncHandler(async (req, res) => {
    
       const user=await User.aggregate([
             {
                $match:{
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
             },
             {
                $lookup: {
                    from: "Videos", 
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistoryVideos",
                    pipeline: [
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"ownerDetails",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1,
                                            coverImage: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"$ownerDetails"
                                }
                            }
                        }
                    ]
                }
             }
       ])

  return res.status(200).json(new ApiResponse(200, user[0].watchHistoryVideos, "Watch history fetched successfully"));

})

// Subscribe to a channel
const subscribeToChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.body;
  if (!channelId) throw new ApiError(400, "Channel ID is required");
  if (channelId === req.user._id.toString()) throw new ApiError(400, "Cannot subscribe to yourself");

  const existing = await Subscription.findOne({ subcriber: req.user._id, channel: channelId });
  if (existing) throw new ApiError(409, "Already subscribed");

  await Subscription.create({ subcriber: req.user._id, channel: channelId });
  const count = await Subscription.countDocuments({ channel: channelId });
  return res.status(200).json(new ApiResponse(200, { isSubscribed: true, subcribersCount: count }, "Subscribed successfully"));
});

// Unsubscribe from a channel
const unsubscribeFromChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.body;
  if (!channelId) throw new ApiError(400, "Channel ID is required");
  await Subscription.deleteOne({ subcriber: req.user._id, channel: channelId });
  const count = await Subscription.countDocuments({ channel: channelId });
  return res.status(200).json(new ApiResponse(200, { isSubscribed: false, subcribersCount: count }, "Unsubscribed successfully"));
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    UpdateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage ,
    getUserChannelProfile ,
    getWatchHistory,
    subscribeToChannel,
    unsubscribeFromChannel
}