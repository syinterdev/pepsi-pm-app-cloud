import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'

import 'react-day-picker/style.css'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 [--rdp-accent-color:theme(colors.zinc.900)]', className)}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
