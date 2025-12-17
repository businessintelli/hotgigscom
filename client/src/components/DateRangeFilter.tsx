import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear' | 'custom';

interface DateRangeFilterProps {
  value: { startDate?: string; endDate?: string; preset?: DateRangePreset };
  onChange: (value: { startDate?: string; endDate?: string; preset?: DateRangePreset }) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (value.startDate && value.endDate) {
      return {
        from: new Date(value.startDate),
        to: new Date(value.endDate)
      };
    }
    return undefined;
  });

  const getPresetDates = (preset: DateRangePreset): { startDate: string; endDate: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        };
      
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday.toISOString(),
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        };
      
      case 'last7days':
        return {
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        };
      
      case 'last30days':
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        };
      
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          startDate: startOfWeek.toISOString(),
          endDate: now.toISOString()
        };
      
      case 'lastWeek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return {
          startDate: lastWeekStart.toISOString(),
          endDate: lastWeekEnd.toISOString()
        };
      
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: startOfMonth.toISOString(),
          endDate: now.toISOString()
        };
      
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          startDate: lastMonthStart.toISOString(),
          endDate: lastMonthEnd.toISOString()
        };
      
      case 'thisQuarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
        return {
          startDate: quarterStart.toISOString(),
          endDate: now.toISOString()
        };
      
      case 'lastQuarter':
        const lastQuarterNum = Math.floor(today.getMonth() / 3) - 1;
        const lastQuarterStart = new Date(today.getFullYear(), lastQuarterNum * 3, 1);
        const lastQuarterEnd = new Date(today.getFullYear(), lastQuarterNum * 3 + 3, 0);
        return {
          startDate: lastQuarterStart.toISOString(),
          endDate: lastQuarterEnd.toISOString()
        };
      
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString(),
          endDate: now.toISOString()
        };
      
      case 'lastYear':
        const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
        return {
          startDate: lastYearStart.toISOString(),
          endDate: lastYearEnd.toISOString()
        };
      
      default:
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        };
    }
  };

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange({ ...value, preset });
    } else {
      const dates = getPresetDates(preset);
      onChange({ ...dates, preset });
      
      // Update calendar display
      setDateRange({
        from: new Date(dates.startDate),
        to: new Date(dates.endDate)
      });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onChange({
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
        preset: 'custom'
      });
    }
  };

  const formatDateRange = () => {
    if (value.preset && value.preset !== 'custom') {
      return value.preset.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return 'Select date range';
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={value.preset || 'last30days'} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-[180px]">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7days">Last 7 Days</SelectItem>
          <SelectItem value="last30days">Last 30 Days</SelectItem>
          <SelectItem value="thisWeek">This Week</SelectItem>
          <SelectItem value="lastWeek">Last Week</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="thisQuarter">This Quarter</SelectItem>
          <SelectItem value="lastQuarter">Last Quarter</SelectItem>
          <SelectItem value="thisYear">This Year</SelectItem>
          <SelectItem value="lastYear">Last Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {value.preset === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
