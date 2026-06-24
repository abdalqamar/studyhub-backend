import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Please set it in your environment.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message || err);
    process.exit(1);
  }
};

export default connectDb;
