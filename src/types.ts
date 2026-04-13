export type FrequencyUnit = "days" | "weeks" | "months";
export type Priority = "low" | "medium" | "high";
export type ReminderStatus = "overdue" | "today" | "upcoming";
export type View = "dashboard" | "list" | "detail";

export type Frequency = {
  interval: number;
  unit: FrequencyUnit;
};

export type Reminder = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  startDate: string;
  frequency: Frequency;
  priority: Priority;
  notes?: string;
  nextDueDate: string;
  lastCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CompletionRecord = {
  id: string;
  reminderId: string;
  reminderTitle: string;
  dueDate: string;
  completedAt: string;
  wasOverdue: boolean;
};

export type ReminderInput = {
  title: string;
  description: string;
  category: string;
  startDate: string;
  frequency: Frequency;
  priority: Priority;
  notes: string;
};

export type AppData = {
  version: 1;
  reminders: Reminder[];
  completions: CompletionRecord[];
};
