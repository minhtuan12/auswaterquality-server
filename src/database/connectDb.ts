import mongoose from "mongoose";

const mongoURI = process.env.MONGO_URI!;

let isConnected = 0; // 0 = disconnected, 1 = connected

export const connectDB = async () => {
    if (isConnected) {
        // ✔ Dùng lại kết nối cũ
        return;
    }

    try {
        const db = await mongoose.connect(mongoURI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 20000,
        });
        isConnected = db.connections[0].readyState;
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection failed", error);
        throw error;
    }
};
