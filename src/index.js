import dotenv from 'dotenv'
import connectDB from "./db/index.js"
import {app} from './app.js';
dotenv.config({
    path:'./.env'
})


connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000,()=>{console.log(`Server is running at Port ${process.env.PORT}`);
  })
})
.catch((error)=>{
  console.log("MONGODB Connection Failed",error);
  
})









/*
import express from 'express'
const app=express()

{async ()=>{
    try{
      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      app.on("error",()=>{
        console.log("ERROR",error);
        throw  error
        
      })
      app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
        
      })
    }
    catch{
        console.log("Error:",console.error);
        throw error
    }
}}{}*/
