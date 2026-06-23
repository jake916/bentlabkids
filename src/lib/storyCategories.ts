/**
 * Canonical list of Bible Story categories.
 * Sourced from the Categories page (src/app/categories/page.tsx) — INITIAL_CATEGORIES, type: "stories".
 * Update here when categories are added/removed in the admin.
 */
export const STORY_CATEGORIES = [
  "Uncategorized",
  "Old Testament",
  "New Testament",
  "Psalms",
  "Proverbs",
  "Gospels",
  "Prophecy",
] as const;

export type StoryCategory = (typeof STORY_CATEGORIES)[number];
