import {asyncHandeler} from "../utils/asyncHandeler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandeler(async(req,res)=>{
  //get user details from frontend
  //validation- not empty
  //check if user already exist : username and email
  //check for images,check for avatar
  //upload on cloudinary,avatar check
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res
   
  const {fullName,email,username,password} = req.body
  console.log("email:",email);

  if (
    [fullName,email,username,password].some((field)=>
      field?.trim() === ""
    )
  ) {
     throw new ApiError(400,"all field are required")
  }

  const exsitedUser = User.findOne({
    $or:[{email} , {username}]
  })

  if (exsitedUser) {
    throw new ApiError(409,"user with email or username exist")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400,"avatar file is required")
  }

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)

 if (!avatar) {
  throw new ApiError(400,"Avatar is required")
 }

 const user = await User.create({
  fullName,
  avatar:avatar.url,
  coverImage:coverImage?.url || "",
  email,
  password,
  username:username.toLowerCase()
 })

const createdUser = await user.findById(user._id).select(
  "-password -refreshToken"
)

if (!createdUser) {
  throw new ApiError(500,"something went wrong while registering the user")
}

return res.status(201).json((
  new ApiResponse(200,createdUser,"user Registered Succesfully")
))

})

export {registerUser,}