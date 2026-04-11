"use client";

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  return (
    <div>
      <div className="flex gap-8 p-8">
        <Button onClick={() => router.push("/add-expense")}>Add Expense</Button>
        <Button onClick={() => router.push("/view-expenses")}>View Expenses</Button>
      </div>
    </div>
  )
}
