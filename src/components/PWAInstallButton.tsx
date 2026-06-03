import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface Props {
  lang: "ar" | "en";
}

export default function PWAInstallButton({ lang }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReady(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsReady(false);
  };

  // Register modern Service Worker in background if possible
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker Active"))
        .catch((err) => console.error("Service worker registration failed:", err));
    }
  }, []);

  if (!isReady) return null;

  return (
    <button
      id="pwa-install-trigger"
      onClick={handleInstallClick}
      className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-red-500/30 bg-red-950/10 hover:bg-red-500/20 text-red-400 font-medium transition-all text-xs md:text-sm cursor-pointer"
    >
      <Download className="w-4 h-4 animate-bounce" id="install-icon" />
      <span>{lang === "ar" ? "تثبيت التطبيق 📱" : "Install App 📱"}</span>
    </button>
  );
}
