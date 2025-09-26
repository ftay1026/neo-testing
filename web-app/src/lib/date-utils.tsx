// src/lib/date-utils.ts
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format a UTC timestamp to user's local timezone
 * @param utcTimestamp - ISO string from database (always UTC)
 * @param formatString - Optional format string
 * @returns Formatted date in user's timezone
 */
export function formatToUserTimezone(
  utcTimestamp: string, 
  formatString?: string
): string {
  const date = new Date(utcTimestamp); // JavaScript automatically handles UTC conversion
  
  if (formatString) {
    return format(date, formatString);
  }
  
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format for detailed display with both relative and absolute time
 */
export function formatDetailedTime(utcTimestamp: string): {
  relative: string;
  absolute: string;
  date: Date;
} {
  const date = new Date(utcTimestamp);
  
  return {
    relative: formatDistanceToNow(date, { addSuffix: true }),
    absolute: format(date, 'PPp'), // "Apr 29, 2021 at 1:45 PM"
    date,
  };
}

/**
 * Check if a message was created after a specific time
 * Handles timezone conversion automatically
 */
export function isMessageAfterTime(
  messageCreatedAt: string | Date, 
  referenceTime: string
): boolean {
  const messageDate = new Date(messageCreatedAt);
  const refDate = new Date(referenceTime);
  return messageDate > refDate;
}

// Component for displaying times with timezone awareness
export function TimeDisplay({ 
  timestamp, 
  showAbsolute = false 
}: { 
  timestamp: string; 
  showAbsolute?: boolean; 
}) {
  const { relative, absolute } = formatDetailedTime(timestamp);
  
  return (
    <span title={absolute} className="text-xs text-muted-foreground">
      {showAbsolute ? absolute : relative}
    </span>
  );
}