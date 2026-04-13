import type { Frequency, ReminderStatus } from "../types";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value: string): string {
  return dateFormatter.format(parseISODate(value));
}

export function addFrequency(fromISO: string, frequency: Frequency): string {
  const date = parseISODate(fromISO);

  if (frequency.unit === "days") {
    date.setDate(date.getDate() + frequency.interval);
  }

  if (frequency.unit === "weeks") {
    date.setDate(date.getDate() + frequency.interval * 7);
  }

  if (frequency.unit === "months") {
    const originalDay = date.getDate();
    date.setMonth(date.getMonth() + frequency.interval, 1);
    const lastDayOfTargetMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  }

  return toISODate(date);
}

export function compareISODate(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = parseISODate(a).getTime();
  const end = parseISODate(b).getTime();
  return Math.round((end - start) / msPerDay);
}

export function getReminderStatus(nextDueDate: string, today = todayISO()): ReminderStatus {
  const comparison = compareISODate(nextDueDate, today);
  if (comparison < 0) return "overdue";
  if (comparison === 0) return "today";
  return "upcoming";
}

export function isWithinNextDays(date: string, days: number, today = todayISO()): boolean {
  const distance = daysBetween(today, date);
  return distance >= 0 && distance <= days;
}
