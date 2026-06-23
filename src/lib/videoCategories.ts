/**
 * Canonical list of Video categories.
 * Sourced from the Categories page (src/app/categories/page.tsx) — INITIAL_CATEGORIES, type: "videos".
 */
export const VIDEO_CATEGORIES = [
  "Uncategorized",
  "Animated Stories",
  "Sing-Along Songs",
  "Memory Verses",
  "Puppet Shows",
  "Science & Bible",
  "Bedtime Stories",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

/** Colour badge for each category in the list table/grid */
export const VIDEO_CATEGORY_COLOURS: Record<string, string> = {
  "Animated Stories": "bg-amber-50 border-amber-100 text-amber-600",
  "Sing-Along Songs": "bg-pink-50 border-pink-100 text-pink-600",
  "Memory Verses":    "bg-indigo-50 border-indigo-100 text-indigo-600",
  "Puppet Shows":     "bg-purple-50 border-purple-100 text-purple-600",
  "Science & Bible":  "bg-emerald-50 border-emerald-100 text-emerald-600",
  "Bedtime Stories":  "bg-blue-50 border-blue-100 text-blue-600",
  "Uncategorized":    "bg-zinc-50 border-zinc-100 text-zinc-500",
};
