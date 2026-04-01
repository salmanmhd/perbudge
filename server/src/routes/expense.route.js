import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mlddleware.js";

const router = Router();

router.post("/add", verifyJWT, (req, res) => {
  res.send("add expense");
});

export default router;
