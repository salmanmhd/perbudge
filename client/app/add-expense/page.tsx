"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePickerDemo } from "@/components/utils/DatePicker"
import { axiosInstance } from "@/lib/axios"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const categoryOptions = ["food", "transport", "groceries", "family", "health"]

function AddExpense() {
  const [amount, setAmount] = useState<number | null>(null)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<string | null>("")
  const [category, setCategory] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    const localStorageUserId = localStorage.getItem("userId")
    setUserId(localStorageUserId)
  }, [

  ])

  async function submitAddExpense() {
    if (!(amount || description || date || category)) {
      toast.error("Please fill all the details")
      console.log("userId: ", userId)
      return
    }

    try {
      let updatedDate = convertDateToISO(date)
      const res = await axiosInstance.post("expense/add", {
        amount, description, category, date: updatedDate, userId
      })

      console.log('res: ', res);
      if (res.data.statusCode === 200) {
        toast.success("Expense added successfully", {
          description: `amount: ${res.data?.data?.amount}`
        })
      }

      setAmount(null)
      setDescription("")
      setCategory(null)
      setDate("")
    } catch (error) {
      toast.error("something went wrong while adding expense")
      console.error(error)
    }

  }


  function convertDateToISO(date: string | null) {
    if (date === null) return
    const newDate = new Date(date);
    return newDate.toISOString();
  }

  return (
    <div>
      <h1 className="m-8 text-2xl font-semibold">Add Expense</h1>
      <Card className="m-8 p-6">
        <div className="flex flex-col gap-3">
          <Label>Amount</Label>
          <Input
            value={amount ?? ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            type="number"
            placeholder="Enter amount"
            className=""
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Description</Label>
          <Input
            type="text"
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Category</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"outline"}>Choose Category</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categoryOptions.map((option) => <DropdownMenuItem onClick={() => setCategory(option)} >{option}</DropdownMenuItem>)}

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-3">
          <Label>Date</Label>
          {/* <DatePickerDemo /> */}
          <input
            type="date"
            className="w-lg rounded-full border border-gray-400 p-2"
            value={date ?? ""}
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
