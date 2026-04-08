import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mlddleware.js";
import { validateRequiredFields } from "../utils/validateFields.js";

import { addExpense, getExpenses } from "../controllers/expense.controller.js";

const router = Router();

router.post("/add", verifyJWT, addExpense);

router.get("/", verifyJWT, getExpenses);

export default router;
