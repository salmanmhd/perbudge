"use client";

import "react-day-picker/style.css";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Brand-styled single-month calendar. Uses react-day-picker's base stylesheet
 * plus the `.kh-rdp` accent overrides in globals.css so it always renders
 * cleanly and picks up the emerald accent.
 */
export function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("kh-rdp", className)}
      {...props}
    />
  );
}
