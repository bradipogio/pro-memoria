import type { CompletionRecord, Reminder, ReminderInput } from "../types";
import { addFrequency, compareISODate, todayISO } from "./date";

export function createReminder(input: ReminderInput): Reminder {
  const now = new Date().toISOString();
  const frequency = normalizeFrequency(input);

  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: cleanOptional(input.description),
    category: cleanOptional(input.category),
    startDate: input.startDate,
    frequency,
    priority: input.priority,
    notes: cleanOptional(input.notes),
    nextDueDate: input.startDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateReminder(reminder: Reminder, input: ReminderInput): Reminder {
  const frequency = normalizeFrequency(input);

  return {
    ...reminder,
    title: input.title.trim(),
    description: cleanOptional(input.description),
    category: cleanOptional(input.category),
    startDate: reminder.startDate,
    frequency,
    priority: input.priority,
    notes: cleanOptional(input.notes),
    nextDueDate: input.startDate,
    updatedAt: new Date().toISOString(),
  };
}

export function completeReminder(
  reminder: Reminder,
  today = todayISO(),
): { reminder: Reminder; completion: CompletionRecord } {
  const completion: CompletionRecord = {
    id: crypto.randomUUID(),
    reminderId: reminder.id,
    reminderTitle: reminder.title,
    dueDate: reminder.nextDueDate,
    completedAt: new Date().toISOString(),
    wasOverdue: compareISODate(reminder.nextDueDate, today) < 0,
  };

  return {
    completion,
    reminder: {
      ...reminder,
      nextDueDate: calculateNextDueDate(reminder.nextDueDate, reminder.frequency, today),
      lastCompletedAt: completion.completedAt,
      updatedAt: completion.completedAt,
    },
  };
}

export function calculateNextDueDate(
  currentDueDate: string,
  frequency: Reminder["frequency"],
  today = todayISO(),
): string {
  let nextDate = addFrequency(currentDueDate, frequency);

  while (compareISODate(nextDate, today) <= 0) {
    nextDate = addFrequency(nextDate, frequency);
  }

  return nextDate;
}

function cleanOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeFrequency(input: ReminderInput): Reminder["frequency"] {
  const interval = Number.isFinite(input.frequency.interval)
    ? Math.max(1, Math.floor(input.frequency.interval))
    : 1;

  return {
    interval,
    unit: input.frequency.unit,
  };
}
