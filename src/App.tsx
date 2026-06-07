import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { LanguageMode, ThemeMode, Report, ARABIC_TRANSLATION, ENGLISH_TRANSLATION } from "./types";

// Import modular sub-components
import LanguageSelector from "./components/LanguageSelector";
import ThemeSelector from "./components/ThemeSelector";
import PWAInstallButton from "./components/PWAInstallButton";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import ToolsContainer from "./components/ToolsContainer";
import ReportsPanel from "./components/ReportsPanel";
import { initializeBackendUrl, getPersistedBackendUrl, savePersistedBackendUrl, getDefaultBackendUrl } from "./utils/api";

import { Crown, LogOut, Terminal, Compass, Laptop, Cpu, ShieldCheck, Settings } from "lucide-react";

export default function App() {
  const [language, setLanguage] = useState<LanguageMode>("ar");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [uniqueUsersCount, setUniqueUsersCount] = useState(1);
  const [authChecking, setAuthChecking] = useState(true);
  const [backendUrl, setBackendUrl] = useState("");
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Initialize and load active backend base URL settings on mount
  useEffect(() => {
    initializeBackendUrl();
    setBackendUrl(getPersistedBackendUrl());
  }, []);

  // Localization labels helper
  const t = language === "ar" ? ARABIC_TRANSLATION : ENGLISH_TRANSLATION;

  // Manage client UI dynamic themes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.style.backgroundColor = "#0a0b0e";
      document.body.style.color = "#e2e8f0";
    } else {
      root.classList.remove("dark");
      document.body.style.backgroundColor = "#f8fafc";
      document.body.style.color = "#0f172a";
    }
  }, [theme]);

  // Monitor Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Elevate admin if specific email
        const isUserAdmin = 
          user.email === "admin@creative.ai" || 
          user.email === "M.Elsayed1111111@gmail.com";
        setIsAdmin(isUserAdmin);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time logs report
  useEffect(() => {
    if (!currentUser) {
      setReports([]);
      return;
    }

    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: Report[] = [];
        snapshot.forEach((docRef) => {
          logs.push({ id: docRef.id, ...docRef.data() } as Report);
        });
        setReports(logs);

        // Compute unique active accounts count from logging
        const ids = new Set(logs.map((l) => l.userId));
        setUniqueUsersCount(Math.max(ids.size, 1));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "reports");
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Log dynamic actions in Firebase Firestore database
  const handleWriteReportAction = async (
    type: "text-to-image" | "image-to-video" | "text-to-speech" | "login",
    prompt: string,
    resultUrl: string
  ) => {
    const userToLog = currentUser || auth.currentUser;
    if (!userToLog) return;

    try {
      const logId = `report-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Prevent Firestore document limit (1MB) exeeded by checking and truncating heavy Base64 payload strings
      let safeResultUrl = resultUrl;
      if (resultUrl && resultUrl.startsWith("data:") && resultUrl.length > 50000) {
        const mimeSeparatorIndex = resultUrl.indexOf(";");
        const mimeType = mimeSeparatorIndex !== -1 ? resultUrl.substring(5, mimeSeparatorIndex) : "application/octet-stream";
        safeResultUrl = `data:${mimeType};base64,truncated...[Size: ${(resultUrl.length / 1024).toFixed(1)} KB]`;
      }

      const logDoc = {
        id: logId,
        userId: userToLog.uid,
        userEmail: userToLog.email || "test@creative.ai",
        userDisplayName: userToLog.displayName || userToLog.email?.split("@")[0] || "Creative Developer",
        type,
        prompt,
        resultUrl: safeResultUrl,
        timestamp: new Date().toISOString(),
        language
      };

      await setDoc(doc(db, "reports", logId), logDoc);
    } catch (err) {
      console.warn("Silent failure writing action logging to Firestore: ", err);
    }
  };

  const handleLoginSuccess = async (user: any, isUserAdmin: boolean) => {
    setCurrentUser(user);
    setIsAdmin(isUserAdmin);
    await handleWriteReportAction("login", "Successfully accessed secure platform workspace tools.", "login_success");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  const isRtl = language === "ar";

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040810]" id="auth-loading-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin mx-auto" />
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Smart Creator AI Suite</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === "light" ? "text-slate-800" : "text-slate-100"}`} dir={isRtl ? "rtl" : "ltr"} id="app-root-viewport">
      {/* HEADER NAVIGATION BAR */}
      <header className={`border-b backdrop-blur-md px-6 py-4 sticky top-0 z-40 ${
        theme === "dark" ? "border-slate-800 bg-[#0a0b0e]/80" : "border-slate-200 bg-white/80"
      }`} id="app-header-navigation">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-500 p-0.5 shadow-md shadow-orange-500/10 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent leading-none mb-1">
                {t.title}
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">
                {isRtl ? "المبدع الذكي المعتمد بسحابة Firebase" : "Cloud Native Creative Engine"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton lang={language} />
            <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
            <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />

            {currentUser && (
              <button
                id="signout-trigger"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs md:text-sm font-medium transition-all cursor-pointer"
                title={t.logoutBtn}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t.logoutBtn}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* PORTAL VIEW CONTAINERS */}
      <main className="max-w-7xl mx-auto px-6 py-8" id="portal-view-container">
        {!currentUser ? (
          <div className="min-h-[70vh] flex items-center justify-center" id="visitor-login-portal">
            <LoginForm lang={language} onLoginSuccess={handleLoginSuccess} />
          </div>
        ) : (
          <div className="space-y-8" id="authenticated-view-block">
            {/* User Profile Banner Bar - Styled as active Bento Card */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
              theme === "dark" 
                ? "border-slate-800 bg-gradient-to-r from-[#151821] to-[#12141c] hover:border-slate-700/80" 
                : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
            }`} id="user-banner">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.uid}`}
                  alt="avatar"
                  className="w-12 h-12 rounded-xl object-cover border border-orange-500/20 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm md:text-base">{currentUser.displayName || currentUser.email?.split("@")[0] || "Creative Mind"}</h3>
                    {isAdmin && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[9px] font-bold border border-orange-500/20 uppercase">
                        <Crown className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">Secured with Firebase Firestore Guard</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-slow inline-block shadow-lg shadow-emerald-500/50" />
                
                <button
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className={`p-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showApiSettings
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-500"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-orange-500"
                  }`}
                  title="Configure API Gateway"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>API</span>
                </button>
              </div>
            </div>

            {/* API Backend Custom Connection Configuration Panel */}
            {showApiSettings && (
              <div className={`p-5 rounded-2xl border space-y-3 transition-all duration-300 ${
                theme === "dark" ? "border-slate-800 bg-[#11131b]" : "border-slate-200 bg-slate-50/50"
              }`} id="api-connection-settings-panel">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    ⚙️ {language === "ar" ? "إعدادات بوابة الربط بالخادم (API Base URL)" : "API Gateway Connection Settings"}
                  </h4>
                  <span className="text-[10px] font-mono bg-orange-500/10 text-orange-500 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">
                    CORS Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === "ar" 
                    ? "عند استضافة واجهة التطبيق بشكل منفصل (مثلاً على Vercel)، يحتاج التطبيق للاتصال بعنوان الـ API الخاص بخادم Cloud Run لتوليد الصور والفيديوهات والكلام."
                    : "If you run or deploy this frontend on an external provider (such as Vercel), specify your active Cloud Run/Server API URL below to direct AI generation requests."}
                </p>
                <div className="flex gap-2 max-w-xl">
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://your-cloud-run-url.run.app"
                    className="flex-1 bg-white dark:bg-[#090b11] border border-slate-200 dark:border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs outline-none font-mono"
                  />
                  <button
                    onClick={() => {
                      savePersistedBackendUrl(backendUrl);
                      alert(language === "ar" ? "تم حفظ التعديلات بنجاح وبدء ربط الخادم!" : "API Gateway target URL updated successfully!");
                      setShowApiSettings(false);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 transition-all cursor-pointer shrink-0"
                  >
                    {language === "ar" ? "حفظ التغييرات" : "Apply Gateway"}
                  </button>
                  <button
                    onClick={() => {
                      const fallback = getDefaultBackendUrl();
                      setBackendUrl(fallback);
                      savePersistedBackendUrl(fallback);
                      alert(language === "ar" ? "تمت استعادة الإعدادات الافتراضية بنجاح!" : "Restored system default API URL targets.");
                      setShowApiSettings(false);
                    }}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
                  >
                    {language === "ar" ? "افتراضي" : "Reset"}
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard counters */}
            <Dashboard reports={reports} usersCount={uniqueUsersCount} lang={language} />

            {/* Core AIs generators workspace */}
            <ToolsContainer
              lang={language}
              userId={currentUser.uid}
              userEmail={currentUser.email || "test@creative.ai"}
              userDisplayName={currentUser.displayName || "Creative Mind"}
              onGenerationSuccess={handleWriteReportAction}
            />

            {/* Comprehensive operations log sheet */}
            <ReportsPanel
              reports={reports}
              lang={language}
              currentUserId={currentUser.uid}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </main>

      {/* FOOTER AREA */}
      <footer className={`mt-16 border-t py-8 text-center text-xs text-slate-500 transition-all duration-300 ${
        theme === "dark" ? "border-slate-900 bg-[#050608]/80" : "border-slate-100 bg-white"
      }`} id="app-footer-bar">
        <div className="max-w-7xl mx-auto px-6">
          <p>© {new Date().getFullYear()} Smart Creator AI - المبدع الذكي. All rights reserved.</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">Built securely in Sandbox Workspace environment.</p>
        </div>
      </footer>
    </div>
  );
}
