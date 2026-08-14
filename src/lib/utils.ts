import { format } from "date-fns";

export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// Current date in IST (Asia/Kolkata) as YYYY-MM-DD.
// offsetDays shifts by whole calendar days (e.g. -1 for yesterday).
// Using IST means the table rolls over at midnight IST, not midnight UTC.
export function getISTDateString(offsetDays = 0): string {
  const now = new Date();
  if (offsetDays) now.setUTCDate(now.getUTCDate() + offsetDays);
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getWhatsAppLink(phoneNumber: string, message?: string): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
  const encodedMessage = message
    ? `?text=${encodeURIComponent(message)}`
    : "";
  return `https://wa.me/${cleanNumber}${encodedMessage}`;
}
