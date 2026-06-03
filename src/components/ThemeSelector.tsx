import React from "react";
import { ThemeMode } from "../types";
import { Sun, Moon } from "lucide-react";

interface Props {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export default function ThemeSelector({ currentTheme, onThemeChange }: Props) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={() => onThemeChange(currentTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center p-2 rounded-lg border border-blue-500/30 bg-blue-950/10 hover:bg-blue-500/20 text-blue-400 transition-all cursor-pointer"
      title={currentTheme === "dark" ? "Switch to Light Mode" : "التبديل إلى الوضع الداكن"}
    >
      {currentTheme === "dark" ? (
        <Sun className="w-5 h-5 animate-pulse-slow" id="sun-icon" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-500" id="moon-icon" />
      )}
    </button>
  );
}
