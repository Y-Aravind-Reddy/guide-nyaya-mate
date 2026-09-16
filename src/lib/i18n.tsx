import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "te", label: "తెలుగు", short: "TE" },
  { code: "ta", label: "தமிழ்", short: "TA" },
  { code: "kn", label: "ಕನ್ನಡ", short: "KN" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

/**
 * Translation-ready dictionary. English is the source of truth; other locales
 * fall back to English for any key that has not been translated yet.
 */
const DICTIONARY: Record<string, Partial<Record<LanguageCode, string>>> = {
  "nav.home": { en: "Home", hi: "होम", te: "హోమ్", ta: "முகப்பு", kn: "ಮುಖಪುಟ" },
  "nav.services": { en: "Government Services", hi: "सरकारी सेवाएँ" },
  "nav.rights": { en: "Legal Rights", hi: "कानूनी अधिकार" },
  "nav.schemes": { en: "Schemes", hi: "योजनाएँ" },
  "nav.knowledge": { en: "Legal Knowledge", hi: "कानूनी ज्ञान" },
  "nav.templates": { en: "Complaint Templates", hi: "शिकायत प्रारूप" },
  "nav.faqs": { en: "FAQs", hi: "सामान्य प्रश्न" },
  "nav.glossary": { en: "Glossary", hi: "शब्दावली" },
  "nav.about": { en: "About", hi: "हमारे बारे में" },
  "nav.contact": { en: "Contact", hi: "संपर्क" },
  "nav.login": { en: "Login", hi: "लॉगिन" },
  "nav.getStarted": { en: "Get Started", hi: "शुरू करें" },
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
  "a11y.skip": { en: "Skip to main content", hi: "मुख्य सामग्री पर जाएँ" },
  "trust.banner": {
    en: "Information is sourced from verified government and official public resources.",
    hi: "जानकारी सत्यापित सरकारी और आधिकारिक सार्वजनिक स्रोतों से ली गई है।",
  },
  "trust.verifiedSources": { en: "Verified Sources" },
  "trust.accessibility": { en: "Accessibility Ready" },
  "trust.secure": { en: "Secure Platform" },
  "trust.privacy": { en: "Privacy Protected" },
  "feedback.question": { en: "Was this information helpful?", hi: "क्या यह जानकारी उपयोगी थी?" },
  "feedback.yes": { en: "Yes", hi: "हाँ" },
  "feedback.no": { en: "No", hi: "नहीं" },
  "feedback.thanks": { en: "Thanks for your feedback.", hi: "आपकी प्रतिक्रिया के लिए धन्यवाद।" },
  "footer.legal": { en: "Legal & Policies" },
  "footer.support": { en: "Support" },
};

const STORAGE_KEY = "nyayamate.lang";

interface I18nValue {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (key, fallback) => fallback ?? DICTIONARY[key]?.en ?? key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: LanguageCode) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const entry = DICTIONARY[key];
      return entry?.[lang] ?? entry?.en ?? fallback ?? key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
