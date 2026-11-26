import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `Database Connected Successfully at Host : ${conn.connection.host}`,
    );
  } catch (error) {
    console.log(`Error While Connecting With Database : ${error.message}`);
  }
};

export default connectDB;
