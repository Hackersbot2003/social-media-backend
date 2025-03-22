import { asyncHandeler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefeshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandeler(async (req, res) => {
  //get user details from frontend
  //validation- not empty
  //check if user already exist : username and email
  //check for images,check for avatar
  //upload on cloudinary,avatar check
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  const { fullName, email, username, password } = req.body;
  console.log("email:", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all field are required");
  }

  const exsitedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (exsitedUser) {
    throw new ApiError(409, "user with email or username exist");
  }
  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user Registered Succesfully"));
});

const loginUser = asyncHandeler(async (req, res) => {
  //req body -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookies

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    //so that these cookies can only be modify through server only
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandeler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    //so that these cookies can only be modify through server only
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandeler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthourized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user, _id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token");
  }
});
const changeCurrentPassword = asyncHandeler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandeler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandeler(async(req,res)=>{
  const {fullName,email}=req.body

  if(!fullName || !email){
    throw new ApiError(400,"all fields are missing")
  }

 const user =  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"account detail updated successfully"))
})

const updateUserAvatar = asyncHandeler(async(req,res)=>{
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar =  await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    throw new ApiError(400,"Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ),select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"avatar updated successfully")
  )
})

const updateUserCoverImage = asyncHandeler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400,"coverImage file is missing")
  }

  const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage) {
    throw new ApiError(400,"Error while uploading coverImage")
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ),select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Cover Image updated Successfully")
  )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken ,changeCurrentPassword ,getCurrentUser ,updateAccountDetails ,updateUserAvatar, updateUserCoverImage };
