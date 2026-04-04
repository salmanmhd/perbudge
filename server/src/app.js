import express from "express";
import userRouter from "./routes/user.route.js";
import expenseRouter from "./routes/expense.route.js";
import cors from "cors";


const app = express();
app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("app running");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/expense", expenseRouter);

// app.listen(PORT, ()=>{});
export { app };
