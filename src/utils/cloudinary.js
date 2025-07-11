import {v2 as cloudinary} from "cloudinary"
import fs from 'fs'


    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME , 
        api_key:process.env.CLOUDINARY_API_KEY , 
        api_secret:process.env.CLOUDINARY_API_SECRET  
    });

    const uploadonCloudinary=async (localFilePath) => {
        try{
            if(!localFilePath)return null

           const response=await cloudinary.uploader.upload(localFilePath,{
             resource_type:"auto"
            })
            //uploaded file successfully
          //  console.log("Files is uploaded on cloudinary",response.url);
          fs.unlinkSync(localFilePath) // delete the local file after upload
            // return the response from cloudinary
            return response
        }catch(error){
            fs.unlinkSync(localFilePath)
            return null;
        }
    }

export {uploadonCloudinary}