import React from "react";
import { LanguageMode } from "../types";
import { Languages } from "lucide-react";

interface Props {
  currentLanguage: LanguageMode;
  onLanguageChange: (lang: LanguageMode) => void;
}

export default function LanguageSelector({ currentLanguage, onLanguageChange }: Props) {
  return (
    <button
      id="language-toggle-btn"
      onClick={() => onLanguageChange(currentLanguage === "ar" ? "en" : "ar")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-950/10 hover:bg-orange-500/20 text-orange-400 font-medium transition-all text-xs md:text-sm cursor-pointer"
      title={currentLanguage === "ar" ? "Switch to English" : "تغيير للعربية"}
    >
      <Languages className="w-4 h-4" id="lang-icon" />
      <span>{currentLanguage === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
