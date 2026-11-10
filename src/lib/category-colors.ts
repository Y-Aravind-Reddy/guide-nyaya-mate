/**
 * Government service & legal category colour system.
 *
 * Single source of truth for the Indian tricolour category palette.
 * Apply to icons, small borders, tags and subtle card backgrounds —
 * never to entire page backgrounds.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  // Service-specific categories use only saffron and India Green.
  aadhaar: "#FF9933",
  pan: "#FF9933",
  passport: "#FF9933",
  "driving licence": "#FF9933",
  "driving license": "#FF9933",
  "birth certificate": "#138808",
  "death certificate": "#138808",
  "voter id": "#FF9933",
  "ration card": "#138808",
  "property & land": "#138808",
  "banking & financial fraud": "#138808",
  "consumer rights": "#138808",
  "labour rights": "#138808",
  "women's rights": "#138808",
  rti: "#138808",
  "court & legal procedures": "#138808",
  "schemes & benefits": "#138808",

  // Broad content categories (database values)
  identity: "#FF9933",
  welfare: "#138808",
  revenue: "#138808",
  finance: "#138808",
  property: "#138808",
  employment: "#138808",
  civic: "#138808",
  transport: "#FF9933",
  legal: "#138808",
  documents: "#FF9933",
  complaints: "#138808",
  "cyber crime": "#138808",
  schemes: "#138808",
  education: "#138808",
  health: "#138808",
};

export const CATEGORY_FALLBACK = "#138808";

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
