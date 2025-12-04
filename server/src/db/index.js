import "dotenv/config";
import mongoose from "mongoose";
console.log("mongo url: ", process.env.MONGO_URI);
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${process.env.DB_NAME}`
    );

    console.log(
      `\nconnected to Mongo! DB host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("");
  }
};

export { connectDB };
