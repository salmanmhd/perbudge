import mongoose from "mongoose";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${process.env.DB_NAME}`
    );

    console.log(
      `\nconnected to Mongo! DB host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("");
  }
};

export { connectDB };
