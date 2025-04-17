import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"
import { DayPicker, DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={className}
      classNames={{
        ...classNames,
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        CaptionNavigation: ({ ...props }) => (
          <div className="flex items-center justify-between">
            <button {...props} className="nav_button nav_button_previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button {...props} className="nav_button nav_button_next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
