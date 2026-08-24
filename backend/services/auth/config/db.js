import mongoose from "mongoose";
import dns from "dns";

// the system resolver refuses SRV lookups (querySrv ECONNREFUSED), which
// mongodb+srv:// requires. ipv4first avoids unreachable AAAA records.
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error("MONGODB_URI is not set. Cannot connect to MongoDB.");
            return;
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export default connectDB;