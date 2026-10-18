/**
 * Government service & legal category colour system.
 *
 * Single source of truth for the Indian-inspired category palette.
 * Apply to icons, small borders, tags and subtle card backgrounds —
 * never to entire page backgrounds.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  // Service-specific (as specified)
  aadhaar: "#DC2626", // Red
  pan: "#7C3AED", // Violet
  passport: "#0F766E", // Teal
  "driving licence": "#F97316", // Orange
  "driving license": "#F97316",
  "birth certificate": "#16A34A", // Green
  "death certificate": "#475569", // Slate
  "voter id": "#6366F1", // Indigo
  "ration card": "#D97706", // Amber
  "property & land": "#92400E", // Brown
  "banking & financial fraud": "#0D9488", // Teal
  "consumer rights": "#CA8A04", // Golden yellow
  "labour rights": "#EA580C", // Orange
  "women's rights": "#DB2777", // Pink
  rti: "#0284C7", // Cyan
  "court & legal procedures": "#7C3AED", // Violet
  "schemes & benefits": "#059669", // Green

  // Broad content categories (database values)
  identity: "#DC2626",
  welfare: "#16A34A",
  revenue: "#92400E",
  finance: "#0D9488",
  property: "#92400E",
  employment: "#EA580C",
  civic: "#6366F1",
  transport: "#F97316",
  legal: "#7C3AED",
  // Common extras
  documents: "#0F766E",
  complaints: "#6366F1",
  "cyber crime": "#0284C7",
  schemes: "#059669",
  education: "#7C3AED",
  health: "#16A34A",
};

export const CATEGORY_FALLBACK = "#2563EB";

/** Resolve a category name to its accent hex, with substring matching. */
export function getCategoryColor(category?: string | null): string {
  if (!category) return CATEGORY_FALLBACK;
  const key = category.toLowerCase().trim();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  const hit = Object.keys(CATEGORY_COLORS).find((k) => key.includes(k));
  return hit ? CATEGORY_COLORS[hit] : CATEGORY_FALLBACK;
}

/** Tint style for icons/tags on light backgrounds (≈10% alpha). */
export function categoryTint(category?: string | null): { backgroundColor: string; color: string } {
  const hex = getCategoryColor(category);
  return { backgroundColor: `${hex}1a`, color: hex };
}
