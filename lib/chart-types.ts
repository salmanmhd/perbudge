/** Props Recharts passes to a custom `<Tooltip content={...} />`. */
export interface ChartTooltipProps<T> {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: T }>;
  label?: string | number;
}
