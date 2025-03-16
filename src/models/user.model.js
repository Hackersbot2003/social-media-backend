import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
  {
    username:{
      type: String,
      required:true,
      lowercase:true,
      trim:true,
      index:true,             //anything jo ki searching me jane wala ho
    },
    email:{
      type: String,
      required:true,
      lowercase:true,
      trim:true,
    },
    fullName:{
      type: String,
      required:true,
      index:true,
      trim:true,
    },
    avatar:{
      type:String  , //cloudinary url
      required:true,
    },
    coverImage:{
      type:String  //cloudinary url
    },
    watchHistory:[
      {
        type:Schema.Types.ObjectId,
        ref:"Video"
      }
    ],
    password:{
      type:String,
      required:[true,"password is required"]
    },
    refreshToken:{
      typr:String
    }
},
{
  timestamps:true
}
)

userSchema.pre("save",async function (next){
  if(!this.isModified("password")) return next()
  this.password = bcrypt.hash(this.password,10)
  next()
})

userSchema.methods.isPasswordCorrect = async function (password){
   return await bcrypt.compare(password,this.password)
}

userSchema.methode.generateAccessToken= function(){
  return jwt.sign(
    {
      _id:this.id,
      email:this.email,
      username:this.username,
      fullName:this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methode.generateRefeshToken= function(){
  return jwt.sign(
    {
      _id:this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User",userSchema)