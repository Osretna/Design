import { Dumbbell, Moon, ShoppingCart, Sun, UserCheck, Truck } from "lucide-react";
import { StoreSettings } from "../types";

interface HeaderProps {
  settings: StoreSettings;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
}

export default function Header({
  settings,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenTracking,
}: HeaderProps) {
  const isAr = language === "ar";
  const name = isAr ? settings.storeNameAr : settings.storeNameEn;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {settings.storeLogo ? (
            <img
              src={settings.storeLogo}
              alt="Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 bg-emerald-50 dark:bg-emerald-950"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <Dumbbell className="w-5 h-5" />
            </div>
          )}
          <span className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white transition-colors duration-300">
            {name || "Sports Store"}
          </span>
        </div>

        {/* Global Toolbar Options */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real-time Track Order button */}
          <button
            onClick={onOpenTracking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/10 text-xs font-extrabold text-emerald-750 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>
              {isAr ? "تتبع طلبك 🚚" : "Track Order 🚚"}
            </span>
          </button>

          {/* Admin Panel button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">
              {isAr ? "لوحة التحكم" : "Admin Panel"}
            </span>
          </button>

          {/* Lang Toggle */}
          <button
            onClick={() => setLanguage(isAr ? "en" : "ar")}
            className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm font-black text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title={isAr ? "Switch to English" : "التحويل للغة العربية"}
          >
            {isAr ? "EN" : "عربي"}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title={isAr ? "تغيير السمة" : "Toggle Theme"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-700" />}
          </button>

          {/* Shopping Cart button */}
          <button
            onClick={onOpenCart}
            className="relative w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
