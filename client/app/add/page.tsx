"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Coffee, Car, Home, Smartphone, Gamepad, ShoppingBag, Pill, Book, Briefcase, Receipt, CreditCard, Banknote, Landmark, SmartphoneNfc, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";

const CATEGORIES = [
  { id: "Food", icon: Coffee, label: "Food" },
  { id: "Travel", icon: Car, label: "Travel" },
  { id: "Rent", icon: Home, label: "Rent" },
  { id: "Bills", icon: Smartphone, label: "Bills" },
  { id: "Entertainment", icon: Gamepad, label: "Fun" },
  { id: "Shopping", icon: ShoppingBag, label: "Shop" },
  { id: "Health", icon: Pill, label: "Health" },
  { id: "Education", icon: Book, label: "Edu" },
  { id: "Work", icon: Briefcase, label: "Work" },
  { id: "Others", icon: Receipt, label: "Others" },
];

const MODES = [
  { id: "Cash", icon: Banknote, label: "Cash" },
  { id: "UPI", icon: SmartphoneNfc, label: "UPI" },
  { id: "Card", icon: CreditCard, label: "Card" },
  { id: "Bank", icon: Landmark, label: "Bank" },
];

export default function AddExpense() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [selectedMode, setSelectedMode] = useState(MODES[1].id); // UPI default
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) === 0) return;
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${getApiUrl()}/expenses`,
        {
          amount: parseFloat(amount),
          category: selectedCategory,
          payment_mode: selectedMode,
          note,
          expense_date: date
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Add Expense</h1>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto pb-24">
        {/* Amount Input */}
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
            <label className="text-sm font-semibold text-gray-500 mb-2 block text-left">Amount</label>
            <div className="flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-400 mr-2">$</span>
                <Input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-5xl font-bold text-primary h-16 border-none text-center focus-visible:ring-0 placeholder:text-gray-200"
                />
            </div>
        </div>

        {/* Date Input */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
             <label className="text-sm font-semibold text-gray-500 mb-2 block">Date</label>
             <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="border-none text-lg p-0 h-auto focus-visible:ring-0"
                />
             </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="text-sm font-semibold text-gray-500 mb-2 block">Category</label>
          <div className="grid grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg transition-all",
                    isSelected ? "bg-blue-100 text-blue-600 ring-2 ring-blue-500" : "hover:bg-gray-100 text-gray-500"
                  )}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-[10px]">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode & Note */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <div>
                 <label className="text-sm font-semibold text-gray-500 mb-2 block">Payment Mode</label>
                 <div className="flex flex-wrap gap-2">
                    {MODES.map((mode) => {
                         const Icon = mode.icon;
                        const isSelected = selectedMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={cn(
                                    "flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all border",
                                    isSelected ? "bg-green-100 border-green-500 text-green-700" : "bg-gray-50 border-transparent text-gray-600"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {mode.label}
                            </button>
                        )
                    })}
                 </div>
            </div>
            
            <div>
                <label className="text-sm font-semibold text-gray-500 mb-2 block">Note</label>
                <Input 
                    placeholder="Add a note (optional)" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-gray-50 border-none"
                />
            </div>
        </div>

        <Button className="w-full h-12 text-lg rounded-xl mt-4" onClick={handleSave} disabled={loading || !amount}>
            {loading ? "Saving..." : "Save Expense"}
        </Button>
      </div>
    </div>
  );
}
