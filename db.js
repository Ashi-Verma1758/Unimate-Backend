// import mongoose from 'mongoose';
// const mongoURL='mongodb://localhost:27017/unimate'

// mongoose.connect(mongoURL, {
//     useNewUrlParser:true,
//     useUnifiedTopology:true
// })

// const db=mongoose.connection;

// db.on('connected',() =>{
//     console.log("mongodb connected");
// });

// db.on('disconnected',() =>{
//     console.log("mongodb disconnected");
// });

// db.on('error',() =>{
//     console.log("mongodb error");
// });

// module.exports=db;

import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/unimate'; // or use process.env.MONGO_URI

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });

    console.log('✅ MongoDB connected');

    const db = mongoose.connection;
    db.on('error', (err) => console.error('❗ MongoDB error:', err));
    db.on('disconnected', () => console.log('❌ MongoDB disconnected'));

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;