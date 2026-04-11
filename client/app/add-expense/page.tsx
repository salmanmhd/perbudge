"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePickerDemo } from "@/components/utils/DatePicker"
import { useEffect, useState } from "react"
import { toast } from "sonner"

function AddExpense() {
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(null)
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    const localStorageUserId = localStorage.getItem("userId")
    setUserId(localStorageUserId)
  }, [

  ])

  async function submitAddExpense() {
    if (!(amount || description || date)) {
      toast.error("Please fill all the details")
      console.log("userId: ", userId)
      return
    }
  }

  return (
    <div>
      <h1 className="m-8 text-2xl font-semibold">Add Expense</h1>
      <Card className="m-8 p-6">
        <div className="flex flex-col gap-3">
          <Label>Amount</Label>
          <Input
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            type="number"
            placeholder="Enter amount"
            className=""
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Amount</Label>
          <Input
            type="text"
            placeholder="Enter amount"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Amount</Label>
          {/* <DatePickerDemo /> */}
          <input
            type="date"
            className="w-lg rounded-full border border-gray-400 p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button
          onClick={
            submitAddExpense
          }
        >
          Add Expense
        </Button>
      </Card>
    </div>
  )
}

export default AddExpense
