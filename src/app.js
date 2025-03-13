import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app=express()

app.use(cors({
  origin:process.env.CORS_ORIGIN  ,                                //providing frontend url in .env 
  credentials:true
}))

app.use(express.json({limit:"16kb"}))                           //limiting json form data
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))              //keping assets for some time
app.use(cookieParser())

 


export {app}