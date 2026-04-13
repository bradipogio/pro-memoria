import type { AppData } from "../types";

const STORAGE_KEY = "pro-memoria:data:v1";

const emptyData: AppData = {
  version: 1,
  reminders: [],
  completions: [],
};

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyData;

  try {
    const parsed = JSON.parse(raw) as AppData;
    if (!Array.isArray(parsed.reminders) || !Array.isArray(parsed.completions)) {
      return emptyData;
    }

    return {
      version: 1,
      reminders: parsed.reminders,
      completions: parsed.completions,
    };
  } catch {
    return emptyData;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
