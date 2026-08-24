import mongoose from "mongoose";
import dns from "dns";

// the system resolver refuses SRV lookups here (querySrv ECONNREFUSED), which
// mongodb+srv:// requires, so these are kept. ipv4first stops Atlas hosts from
// resolving to unreachable AAAA records first.
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

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      family: 4
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    if (error.name === "MongooseServerSelectionError") {
      console.error(
        "SRV resolved but no replica-set member was reachable. Check Atlas " +
        "Network Access (is your current IP allowlisted?) and that outbound " +
        "TCP 27017 is not blocked by your network."
      );
    }
  }
};

export default connectDB;