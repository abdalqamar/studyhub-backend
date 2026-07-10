import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Please set it in your environment.");
    process.exit(1);
  }
  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn(
      "[MongoDB] Disconnected. Mongoose will attempt to reconnect automatically.",
    );
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Reconnected successfully.");
  });

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error("[MongoDB] Failed to connect:", err.message);
    } else {
      console.error("[MongoDB] Failed to connect:", err);
    }
    process.exit(1);
  }
};

export default connectDb;
