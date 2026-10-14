import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_PROFILE,
  type FoodItem,
  type LogEntry,
  type Profile,
  type WeightEntry,
} from "../lib/types";

export interface AppState {
  profile: Profile;
  entries: LogEntry[];
  weights: WeightEntry[];
  /** Foods the user has used or saved, for quick re-logging. */
  foods: FoodItem[];
  /** Optional USDA API key (stored locally only). */
  usdaApiKey: string;

  updateProfile: (patch: Partial<Profile>) => void;
  addEntry: (entry: LogEntry) => void;
  updateEntry: (id: string, patch: Partial<LogEntry>) => void;
  removeEntry: (id: string) => void;
  setWeight: (entry: WeightEntry) => void;
  removeWeight: (date: string) => void;
  rememberFood: (food: FoodItem) => void;
  setUsdaApiKey: (key: string) => void;
  importState: (data: Partial<AppState>) => void;
}

const STORAGE_KEY = "macro-tracker-v1";
const MAX_REMEMBERED_FOODS = 300;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      entries: [],
      weights: [],
      foods: [],
      usdaApiKey: "",

      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),

      addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),

      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      setWeight: (entry) =>
        set((s) => ({
          weights: [
            ...s.weights.filter((w) => w.date !== entry.date),
            entry,
          ].sort((a, b) => a.date.localeCompare(b.date)),
        })),

      removeWeight: (date) =>
        set((s) => ({ weights: s.weights.filter((w) => w.date !== date) })),

      rememberFood: (food) =>
        set((s) => {
          const rest = s.foods.filter((f) => f.id !== food.id);
          return { foods: [food, ...rest].slice(0, MAX_REMEMBERED_FOODS) };
        }),

      setUsdaApiKey: (key) => set({ usdaApiKey: key.trim() }),

      importState: (data) => set((s) => ({ ...s, ...data })),
    }),
    { name: STORAGE_KEY, version: 1 },
  ),
);
