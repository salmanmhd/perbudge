// import { validateRequiredFields } from "../utils/validateFields";
import z from "zod";
import Expense from "../models/expense.model.js";

const addExpensePayloadSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  date: z.iso.datetime({
    message: "Invalid ISO String, Expected YYYY-MM-DDTHH:MM:SSZ",
  }),
  userId: z.string(),
});

async function addExpense(req, res) {
  const { amount, description, category, date, userId } = req.body;

  const requiredFields = [
    "amount",
    "description",
    "category",
    "date",
    "userId",
  ];

  //   const missingFields = validateRequiredFields(req.body, requiredFields);
  //   if (!missingFields.isValid) {
  //     return res.status(400).json({
  //       error: `Missing required fields: ${missingFields.missingFields.join(", ")}`,
  //     });
  //   }

  const validatePayload = addExpensePayloadSchema.safeParse(req.body);
  console.log("validate: ", validatePayload);
  if (!validatePayload.success) {
    return res.status(400).json({
      statusCode: 400,
      msg: "unable to add expense, invalid payload",
      error: validatePayload.error.format(),
    });
  }
  try {
    const newExpense = await Expense.create({
      amount,
      description,
      category,
      date,
      userId,
    });
    if (!newExpense) {
      return res.status(500).json({
        statusCode: 500,
        msg: "Unable to add transaction, try again",
        error: "unable to write to mongodb",
      });
    }

    res.status(200).json({
      statusCode: 200,
      msg: "Transaction added successfully",
      data: newExpense,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      msg: "Unable to add transaction, try again",
      error: error.message,
    });
  }
}

async function getExpenses(req, res) {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({
      statusCode: 400,
      msg: "Unable to access",
      error: "UserId missing",
    });
  }

  try {
    const expenses = await Expense.find({ userId });

    // if(!expenses){
    //  return res.status(200).json({
    //   statusCode: 200,
    //   msg: "Transaction not found"
    // })
    // }

    res.status(200).json({
      statusCode: 200,
      msg: "Transactions fetched successfully",
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      msg: "Something went wrong",
      error: error.message,
    });
  }
}
export { addExpense, getExpenses };
