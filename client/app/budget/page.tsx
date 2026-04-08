"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function BudgetPage() {
  const router = useRouter();
  const [budget, setBudget] = useState<{ total_budget: string } | null>(null);
  const [newBudget, setNewBudget] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spent, setSpent] = useState(0);

  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => {
    fetchBudgetAndSpend();
  }, []);

  const fetchBudgetAndSpend = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
        // Fetch budget
        const budgetRes = await axios.get(`http://localhost:4000/budgets/current?month=${currentMonth}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setBudget(budgetRes.data.total_budget ? budgetRes.data : null);
        if (budgetRes.data.total_budget) setNewBudget(budgetRes.data.total_budget);

        // Fetch spend
        const spendRes = await axios.get(`http://localhost:4000/analytics/monthly-summary?month=${currentMonth}`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        setSpent(parseFloat(spendRes.data.totalSpent || "0"));

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
      setSaving(true);
      const token = localStorage.getItem("token");
      try {
          await axios.post('http://localhost:4000/budgets', {
              month: currentMonth,
              total_budget: parseFloat(newBudget)
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          fetchBudgetAndSpend();
      } catch (err) {
          console.error(err);
          alert("Failed to save budget");
      } finally {
          setSaving(false);
      }
  }

  const budgetAmount = budget ? parseFloat(budget.total_budget) : 0;
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 space-y-6">
      <h1 className="text-2xl font-bold">Budget & Goals</h1>

      {/* Current Status */}
      <Card>
          <CardHeader>
              <CardTitle>This Month's Budget</CardTitle>
              <CardDescription>{format(new Date(), "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                  <div>
                      <p className="text-sm text-gray-500">Spent</p>
                      <p className="text-2xl font-bold">${spent.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="text-2xl font-bold text-gray-400">/ ${budgetAmount.toFixed(2)}</p>
                  </div>
              </div>

               {/* Custom Progress Bar since I didn't install shadcn progress yet */}
               <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                   <div 
                        className={cn("h-full transition-all duration-500", percentage > 100 ? "bg-red-500" : "bg-green-500")}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                   />
               </div>
               <p className="text-sm text-center text-gray-500">
                   {percentage > 100 ? "You've exceeded your budget!" : `${(100 - percentage).toFixed(0)}% remaining`}
               </p>
          </CardContent>
      </Card>

      {/* Edit Budget */}
      <Card>
          <CardHeader>
              <CardTitle>Update Budget</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Limit</label>
                  <Input 
                    type="number" 
                    value={newBudget} 
                    onChange={(e) => setNewBudget(e.target.value)} 
                    placeholder="Enter amount"
                  />
              </div>
          </CardContent>
          <CardFooter>
              <Button onClick={handleSaveBudget} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Set Budget"}
              </Button>
          </CardFooter>
      </Card>
    </div>
  );
}
