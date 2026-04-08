import { Button } from "@/components/ui/button"

export default function Dashboard() {
  return (
    <div>
      <div className="flex gap-8 p-8">
        <Button>Add Expense</Button>
        <Button>View Expenses</Button>
      </div>
    </div>
  )
}
