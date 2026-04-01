import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.mlddleware.js";
import { validateRequiredFields } from "../utils/validateFields.js";
import Expense from "../models/expense.model.js";

const router = Router();

router.post("/add", verifyJWT,async (req, res) => {
  const { amount, description, category, date, userId } = req.body;

  const requiredFields = ["amount", "description", "category", "date", "userId"];

  const missingFields = validateRequiredFields(req.body, requiredFields);
  if(!missingFields.isValid) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.missingFields.join(", ")}` });
  }

  
  try {
    const newExpense = await Expense.create({amount, description, category, date, userId})
  if(!newExpense){
    return res.status(500).json({
      statusCode: 500,
      msg: "Unable to add transaction, try again",
      error: "unable to write to mongodb"
    })
  }

  res.status(200).json({
    statusCode: 200,
    msg: "Transaction added successfully",
    data: newExpense
  })

  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      msg: "Unable to add transaction, try again",
      error: error.message
    })
  }

});

router.get("/", verifyJWT, async(req, res)=>{
  const {userId} = req.body
  if(!userId){
    return res.status(400).json({
      statusCode: 400,
      msg: "Unable to access",
      error: "UserId missing"
    })
  }


  try {
    const expenses = await Expense.find({userId})

    // if(!expenses){
    //  return res.status(200).json({
    //   statusCode: 200,
    //   msg: "Transaction not found"
    // })
    // }

    res.status(200).json({
      statusCode: 200,
      msg: "Transaction",
      data: expenses
    })

  } catch (error) {
    res.status(500).json({
      statusCode: 500, 
      msg: "Something went wrong",
      error: error.message
    })
  }

})



export default router;
