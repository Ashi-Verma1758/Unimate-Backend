import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () =>{
    try{
       const connectionInstance = await  mongoose.connect(process.env.MONGODB_URI, {
      dbName:DB_NAME
       });
     console.log("DB HOST:", connectionInstance.connection.host);
console.log("Connected DB:", connectionInstance.connection.name);
    }catch(error){
        console.log("Mongodb connection error", error);
        process.exit(1);
    }
}
export default connectDB
