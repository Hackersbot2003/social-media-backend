// require ("dotenv").config({path:"./env"})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import express from "express"
import { app } from "./app.js";




dotenv.config({
  path:"./.env"
})

connectDB()
.then(()=>{
  app.on("error",()=>{
    console.log("ERROR",error);
    throw error
  })
  
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`server running on port ${process.env.PORT}`);
    
  })
})
.catch((err)=>{
  console.log("mongodb connection failed",err);
  
})












/*
import express from "express"
const app=express()

//iife           Immediately executable functions
(async()=>{
   try {
     mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
     app.on("error",(error)=>{
      console.log("ERROR",error);
      
     })
     app.listen(process.env.PORT,()=>{
      console.log(`app is listening on port ${process.env.PORT}`);
      
     })
   } catch (error) {
     console.error("ERROR",error)
     throw error
   }
})()

*/
