/**
 * Canonical list of Prayer categories.
 * Sourced from the Categories page (src/app/categories/page.tsx) — INITIAL_CATEGORIES, type: "prayers".
 */
export const PRAYER_CATEGORIES = [
  "Uncategorized",
  "Morning Prayers",
  "Night Prayers",
  "Gratitude",
  "Healing",
  "Family & Friends",
  "Protection",
] as const;

export type PrayerCategory = (typeof PRAYER_CATEGORIES)[number];

/** Colour badge for each category in the list table */
export const PRAYER_CATEGORY_COLOURS: Record<string, string> = {
  "Morning Prayers":  "bg-amber-50  border-amber-100  text-amber-600",
  "Night Prayers":    "bg-blue-50   border-blue-100   text-blue-600",
  "Gratitude":        "bg-emerald-50 border-emerald-100 text-emerald-600",
  "Healing":          "bg-rose-50   border-rose-100   text-rose-600",
  "Family & Friends": "bg-purple-50 border-purple-100 text-purple-600",
  "Protection":       "bg-sky-50    border-sky-100    text-sky-600",
  "Uncategorized":    "bg-zinc-50   border-zinc-100   text-zinc-500",
};
