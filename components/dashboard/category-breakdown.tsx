export function CategoryBreakdown({
  data,
}: {
  data: { name: string; value: number; count?: number }[];
}) {
  if (!data?.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No expense data available for this month.
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.value));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name} className="flex items-center">
          <div className="w-[100px] truncate text-sm font-medium">{item.name}</div>
          <div className="flex-1 ml-4 relative h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="w-[80px] text-right text-sm text-muted-foreground ml-4">
            {formatCurrency(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}
