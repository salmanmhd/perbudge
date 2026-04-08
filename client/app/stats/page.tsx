"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from "@/lib/api";

export default function StatsPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [currentMonth]);

  const fetchStats = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await axios.get(`${getApiUrl()}/analytics/monthly-summary?month=${monthStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 bg-white shadow-sm flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft />
        </Button>
        <h1 className="text-lg font-bold">{format(currentMonth, "MMMM yyyy")}</h1>
        <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Total Spent */}
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">${data?.totalSpent ? parseFloat(data.totalSpent).toFixed(2) : "0.00"}</div>
            </CardContent>
        </Card>

        {/* Daily Spending Chart */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Daily Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
                {loading ? <div className="h-full bg-gray-100 animate-pulse rounded" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.dailySpending || []}>
                            <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "dd")} fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>

        {/* Categories */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
               {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded"/>)}</div> : (
                   <div className="space-y-4">
                       {data?.categoryBreakdown?.map((item: any, index: number) => (
                           <div key={item.category} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                   <span className="text-sm font-medium">{item.category}</span>
                               </div>
                               <span className="font-bold text-sm">${parseFloat(item.total).toFixed(2)}</span>
                           </div>
                       ))}
                       {(!data?.categoryBreakdown || data.categoryBreakdown.length === 0) && (
                           <p className="text-center text-gray-400 text-sm">No data for this month</p>
                       )}
                   </div>
               )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
