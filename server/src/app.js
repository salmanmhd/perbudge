import express from "express";
import userRouter from "./routes/user.route.js";

// import cors from "cors";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("app running");
});

app.use("/api/v1/user", userRouter);

// app.listen(PORT, ()=>{});
export { app };
