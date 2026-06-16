import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "zh-CN", label: "简体中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 border border-gray-200 transition-all"
      >
        <Globe size={12} />
        <span>{currentLang.label}</span>
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 min-w-[140px]"
          onMouseLeave={() => setOpen(false)}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLang(lang.code)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                lang.code === i18n.language
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
