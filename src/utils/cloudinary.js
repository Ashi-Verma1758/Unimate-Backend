// import {v2 as cloudinary}  from 'cloudinary';
// import fs from 'fs';


// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// console.log("🔐 Checking Cloudinary ENV:", {
//   CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
//   CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
//   CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ Loaded' : '❌ Missing'
// });



// const uploadOnCloudinary = async (localFilePath) =>{
//   try {
//     if(!localFilePath) return null;
//     // Upload the file to Cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: 'auto',

//     })
//     //file has been uploaded successfully
//     console.log('File uploaded successfully to Cloudinary', response.url);
//     return response;
//   }
//   catch(error){
//     fs.unlinkSync(localFilePath); //remove the locally saved temp file as the upload got failed
//     return null;

//   }
// }
// export const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) {
//       console.log("❗ localFilePath missing");
//       return null;
//     }

    // Debug check: does the file exist before trying to upload?
//     if (!fs.existsSync(localFilePath)) {
//       console.log("❗ Temp file not found:", localFilePath);
//       return null;
//     }

//     console.log("🚀 Uploading to Cloudinary:", localFilePath);
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: 'auto',
//       folder: 'unimate-events',
//       use_filename: true,
//       unique_filename: false,
//       filename_override: `event_${Date.now()}`,
//     });

//     fs.unlinkSync(localFilePath); // Clean up local file
//     console.log("✅ Cloudinary upload success:", response.secure_url);
//     return response;
//   } catch (error) {
//     console.error("❌ Cloudinary upload error:", error.message);
//     if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
//     return null;
//   }
// };

// export { uploadOnCloudinary };