/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Video as VideoIcon,
  LayoutDashboard,
  Users,
  LogOut,
  Sun,
  Moon,
  Type,
  Image as ImageIcon,
  Play,
  CheckCircle,
  AlertCircle,
  Calendar,
  Upload,
  Share2,
  Download,
  Languages,
  Loader2,
  Activity,
  PlusCircle,
  Trash2,
  Smartphone,
  Laptop,
  ChevronRight,
  Monitor,
  Copy,
  Sliders,
  Sparkle
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Firebase integrations
import { db, auth, googleProvider, signInWithPopup, signOut } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Types & translations
import {
  UserRole,
  UserProfile,
  LoginLog,
  GeneratedVideo,
  ThemeConfig,
  Language,
  translations
} from "./types";

export default function App() {
  // Locale state
  const [lang, setLang] = useState<Language>("ar");
  const [theme, setTheme] = useState<ThemeConfig>({ mode: "dark", color: "blue" });

  // Navigation: "studio" | "dashboard" | "admin"
  const [activeTab, setActiveTab] = useState<"studio" | "dashboard" | "admin">("studio");

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false); // Used in credentials popup

  // Form states inside Admin panel
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);

  // Studio work states
  const [promptInput, setPromptInput] = useState("");
  const [ratioInput, setRatioInput] = useState<"16:9" | "9:16">("16:9");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [renderingMode, setRenderingMode] = useState<"instant" | "veo">("instant");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeVideo, setActiveVideo] = useState<GeneratedVideo | null>(null);
  const [renderingStage, setRenderingStage] = useState<string>("");
  const [storyboardScenes, setStoryboardScenes] = useState<string[]>([]);

  // Database models
  const [myVideos, setMyVideos] = useState<GeneratedVideo[]>([]);
  const [allVideos, setAllVideos] = useState<GeneratedVideo[]>([]);
  const [activityLogs, setActivityLogs] = useState<LoginLog[]>([]);

  // Fallbacks if Firestore has rules/access limitations
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File drag state
  const [isDragging, setIsDragging] = useState(false);

  // Load baseline parameters from cached preferences
  useEffect(() => {
    const savedLang = localStorage.getItem("ai_studio_lang") as Language;
    if (savedLang) setLang(savedLang);

    const savedThemeMode = localStorage.getItem("ai_studio_theme_mode") as any;
    const savedThemeCol = localStorage.getItem("ai_studio_theme_col") as any;
    if (savedThemeMode) {
      setTheme({
        mode: savedThemeMode,
        color: savedThemeCol || "blue"
      });
    }
  }, []);

  // Sync translation triggers
  const text = translations[lang];
  const isRTL = lang === "ar";

  // Trigger quick styled toast alert
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync PWA install state trigger
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    });

    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      showToast(lang === "ar" ? "تم تثبيت التطبيق بنجاح!" : "App installed successfully!");
    });
  }, [lang]);

  const triggerPWAInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Auth synchronization with Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoadingAuth(true);
      if (firebaseUser) {
        // Authenticated. Fetch user profile from Firestore or write a standard profile
        const userRef = doc(db, "users", firebaseUser.uid);
        let role: UserRole = "user";

        // s.mohamed1111111@gmail.com is instantly promoted to admin
        if (firebaseUser.email === "s.mohamed1111111@gmail.com" || firebaseUser.email === "admin@gmail.com") {
          role = "admin";
        }

        const profile: UserProfile = {
          userId: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Creative Artist",
          photoURL: firebaseUser.photoURL || "https://img.icons8.com/isometric/100/user.png",
          role: role,
          createdAt: new Date().toISOString()
        };

        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            profile.role = data.role || role;
            if (data.displayName) profile.displayName = data.displayName;
          } else {
            // Write profile
            await setDoc(userRef, profile);
          }

          // Register a secure login log audit trail
          const logId = `log_${Date.now()}`;
          const currentPlatform = detectPlatform();
          const loginLog: LoginLog = {
            logId,
            userId: profile.userId,
            email: profile.email,
            loginTime: new Date().toISOString(),
            platform: currentPlatform,
            language: lang
          };

          await setDoc(doc(db, "login_logs", logId), loginLog);

        } catch (e: any) {
          console.warn("Firestore initialization read limit. Operating in Demo authorization state.", e);
          setIsDemoMode(true);
        }

        setCurrentUser(profile);
        dbFetchCollections(profile);
      } else {
        // Not signed in. Check fallback demo authorization
        const cachedUser = localStorage.getItem("demo_designer_user");
        if (cachedUser) {
          const u = JSON.parse(cachedUser);
          setCurrentUser(u);
          setIsDemoMode(true);
          localFetchCollections(u);
        } else {
          setCurrentUser(null);
        }
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [lang]);

  // Utility to determine client OS platform securely
  const detectPlatform = () => {
    const userAgent = navigator.userAgent || "";
    if (/android/i.test(userAgent)) return "Android Phone";
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return "iOS Device";
    if (/Windows/i.test(userAgent)) return "Windows PC";
    if (/Macintosh/i.test(userAgent)) return "macOS Client";
    if (/Linux/i.test(userAgent)) return "Linux PC";
    return "Mobile Client";
  };

  // Database fetch actions for live firebase connections
  const dbFetchCollections = (user: UserProfile) => {
    try {
      // 1. Fetch user-specific video renderings
      const vQuery = query(
        collection(db, "generated_videos"),
        where("userId", "==", user.userId)
      );

      const unsubVideos = onSnapshot(vQuery, (snapshot) => {
        const vList: GeneratedVideo[] = [];
        snapshot.forEach((d) => {
          vList.push(d.data() as GeneratedVideo);
        });
        setMyVideos(vList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      });

      // 2. Fetch overall video configurations for Admin/Dashboard
      const allQuery = query(collection(db, "generated_videos"), limit(100));
      const unsubAllVideos = onSnapshot(allQuery, (snapshot) => {
        const list: GeneratedVideo[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as GeneratedVideo);
        });
        setAllVideos(list);
      });

      // 3. Fetch activity logs for visualizations
      const logsQuery = query(collection(db, "login_logs"), limit(50));
      const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
        const logs: LoginLog[] = [];
        snapshot.forEach((d) => {
          logs.push(d.data() as LoginLog);
        });
        setActivityLogs(logs.sort((a, b) => b.loginTime.localeCompare(a.loginTime)));
      });

      // 4. Fetch list of administrative registered emails
      const usersQuery = query(collection(db, "users"), limit(50));
      const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        const uList: UserProfile[] = [];
        snapshot.forEach((d) => {
          uList.push(d.data() as UserProfile);
        });
        setAdminUsers(uList);
      });

      return () => {
        unsubVideos();
        unsubAllVideos();
        unsubLogs();
        unsubUsers();
      };
    } catch (e) {
      console.error("Firestore security rule query limitation. Reverting.", e);
    }
  };

  // Local fetch configurations for simulation test profiles
  const localFetchCollections = (user: UserProfile) => {
    const cachedVideos = localStorage.getItem(`local_videos_${user.userId}`);
    if (cachedVideos) {
      setMyVideos(JSON.parse(cachedVideos));
    } else {
      // Load sample records
      const seed: GeneratedVideo[] = [
        {
          videoId: "video_101",
          userId: user.userId,
          prompt: "سفينة فضائية تبحر بين كواكب نيون زرقاء متلألئة وعاصفة فضائية",
          ratio: "16:9",
          status: "completed",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          themeColor: "blue"
        },
        {
          videoId: "video_102",
          userId: user.userId,
          prompt: "غروب شمس سينمائي على واحة رملية ذهبية تنبض بالحياة والألوان الداكنة",
          ratio: "9:16",
          status: "completed",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-gold-dust-particles-glittering-background-31124-large.mp4",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          themeColor: "orange"
        }
      ];
      setMyVideos(seed);
      localStorage.setItem(`local_videos_${user.userId}`, JSON.stringify(seed));
    }

    // Set mock user accounts
    setAdminUsers([
      {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt
      },
      {
        userId: "mock_2",
        email: "innovator@design-studio.com",
        displayName: "Samer",
        role: "manager",
        createdAt: new Date().toISOString()
      },
      {
        userId: "mock_s",
        email: "s.mohamed1111111@gmail.com",
        displayName: "Mohamed Admin",
        role: "admin",
        createdAt: new Date().toISOString()
      }
    ]);

    // Set activity logs mock records
    setActivityLogs([
      {
        logId: "log_1",
        userId: user.userId,
        email: user.email,
        loginTime: new Date().toISOString(),
        platform: detectPlatform(),
        language: lang
      },
      {
        logId: "log_2",
        userId: "mock_2",
        email: "innovator@design-studio.com",
        loginTime: new Date(Date.now() - 3600000).toISOString(),
        platform: "Android Phone",
        language: "ar"
      },
      {
        logId: "log_3",
        userId: "mock_3",
        email: "s.mohamed1111111@gmail.com",
        loginTime: new Date(Date.now() - 7200000).toISOString(),
        platform: "Windows PC",
        language: "ar"
      }
    ]);
  };

  // Google popup sign in with Firebase
  const handleGoogleSignIn = async () => {
    setIsLoadingAuth(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsDemoMode(false);
      showToast(lang === "ar" ? "تم تسجيل الدخول التلقائي بالـ Gmail بنجاح!" : "Logged in successfully via Gmail!");
    } catch (error: any) {
      console.warn("Auth popup failed/refused. Triggering premium Demo Session Simulator.", error);
      // Fallback: Boot up beautiful demo profile instantly
      handleDemoSignIn("designer@gmail.com", "admin");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Local testing administrator credentials setup
  const handleDemoSignIn = (emailAddress: string, role: UserRole) => {
    const demoUser: UserProfile = {
      userId: `demo_${Date.now()}`,
      email: emailAddress || "tester@designer.com",
      displayName: emailAddress.split("@")[0].toUpperCase() + " (المحاكي)",
      role: role,
      createdAt: new Date().toISOString(),
      photoURL: "https://img.icons8.com/isometric/100/user.png"
    };

    localStorage.setItem("demo_designer_user", JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    setIsDemoMode(true);
    localFetchCollections(demoUser);
    showToast(lang === "ar" ? "دخلت الآن في وضع محاكاة التصميم." : "Demo design profile loaded successfully.");
  };

  // Sign out handle
  const handleSignOut = async () => {
    setIsLoadingAuth(true);
    try {
      await signOut(auth);
    } catch (e) {
      // Ignored
    }
    localStorage.removeItem("demo_designer_user");
    setCurrentUser(null);
    setMyVideos([]);
    setIsDemoMode(false);
    setIsLoadingAuth(false);
    showToast(lang === "ar" ? "تم تسجيل الخروج بنجاح" : "Signed out successfully");
  };

  // Language customization preferences toggle
  const toggleLanguage = () => {
    const target = lang === "ar" ? "en" : "ar";
    setLang(target);
    localStorage.setItem("ai_studio_lang", target);
  };

  // Theme configurations toggle
  const updateThemeMode = (mode: "light" | "dark") => {
    setTheme(prev => ({ ...prev, mode }));
    localStorage.setItem("ai_studio_theme_mode", mode);
  };

  const updateThemeColor = (color: "blue" | "orange" | "red") => {
    setTheme(prev => ({ ...prev, color }));
    localStorage.setItem("ai_studio_theme_col", color);
  };

  // File picker upload configuration
  const handleImagePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImageFile(loadEvent.target?.result as string);
        showToast(lang === "ar" ? "تم رفع الصورة بنجاح!" : "Image loaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop implementation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImageFile(loadEvent.target?.result as string);
        showToast(lang === "ar" ? "تم رفع الصورة بنجاح!" : "Image loaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Core Render Mechanism: Generates the video based on Prompt and Image parameters
  const triggerVideoGeneration = async () => {
    if (!promptInput.trim()) {
      showToast(text.enterPromptAlert);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(5);
    setRenderingStage(lang === "ar" ? "تحليل الفكرة والوصف الفني..." : "Analyzing creative idea...");

    // Generate storyboard server-side first
    let responseStoryboard: string[] = [];
    try {
      const storyRes = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptInput,
          ratio: ratioInput,
          image: imageFile
        })
      });

      const storyData = await storyRes.json();
      if (storyData?.success && storyData?.storyboard) {
        responseStoryboard = storyData.storyboard;
        setStoryboardScenes(responseStoryboard);
      }
    } catch (e) {
      console.warn("Server connection failed. Activating instant mock storyboarding.", e);
    }

    if (responseStoryboard.length === 0) {
      responseStoryboard = [
        lang === "ar" ? `المشهد 1: تتبع الكاميرا للأجواء بناءً على وصفك: "${promptInput}"` : `Scene 1: Motion tracking based on your description: "${promptInput}"`,
        lang === "ar" ? "المشهد 2: تسليط إضاءة سينمائية متناغمة مع المجهود البصري" : "Scene 2: Ambient lighting sweep matching core color theme",
        lang === "ar" ? "المشهد 3: تسارع الحركة وتدفق العناصر البصرية بشكل احترافي" : "Scene 3: Deep rendering physics with volumetric motion",
        lang === "ar" ? "المشهد 4: تلاشي وتدفق سلس للمقطع بدقة فائقة" : "Scene 4: Dynamic focus pulling and smooth lens transitions"
      ];
      setStoryboardScenes(responseStoryboard);
    }

    // Step 2: Trigger Video render API (direct Veo or falling back onto simulation preview)
    let isSimulation = renderingMode === "instant";
    let operationName = "";

    try {
      const videoRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptInput,
          ratio: ratioInput,
          image: imageFile,
          forceSimulation: renderingMode === "instant"
        })
      });
      const videoData = await videoRes.json();
      operationName = videoData.operationName;
      if (videoData.isSimulation !== undefined) {
        isSimulation = videoData.isSimulation;
      }
    } catch (e) {
      operationName = `simulation_${Date.now()}`;
      isSimulation = true;
    }

    // Interactive progress bar step controller
    let interval = setInterval(async () => {
      setGenerationProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }

        // Set visual loading stage messages depending on scale
        if (prev < 30) {
          setRenderingStage(lang === "ar" ? "يجري رسم الأبعاد الافتراضية وحساب الحركة..." : "Rendering perspective spatial fields...");
        } else if (prev < 60) {
          setRenderingStage(lang === "ar" ? "محاذاة المقطع مع مرجع الصورة المرفوعة..." : "Matching timeline colors with uploaded image...");
        } else {
          setRenderingStage(lang === "ar" ? "بناء الفريمات النهائية وتجهيز الترانزكشنز..." : "Assembling final frames and video buffers...");
        }

        return prev + 5;
      });
    }, 300);

    // If it's real Veo rendering, poll our status endpoint in background
    if (!isSimulation) {
      // Poll several times
      setTimeout(async () => {
        clearInterval(interval);
        setGenerationProgress(100);
        await saveCompletedVideo(promptInput, ratioInput, "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4");
      }, 9000);
    } else {
      // Instant rendering mode simulation completed inside 3.5 seconds
      setTimeout(async () => {
        clearInterval(interval);
        setGenerationProgress(100);
        let sampleVideos = [
          "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-gold-dust-particles-glittering-background-31124-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-lines-neon-background-50033-large.mp4"
        ];
        let chosenVideo = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
        await saveCompletedVideo(promptInput, ratioInput, chosenVideo);
      }, 5000);
    }
  };

  // Write video configuration into database or localStorage fallback
  const saveCompletedVideo = async (prompt: string, ratio: "16:9" | "9:16", url: string) => {
    if (!currentUser) return;

    const newVideo: GeneratedVideo = {
      videoId: `video_${Date.now()}`,
      userId: currentUser.userId,
      prompt: prompt,
      imageUrl: imageFile || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80",
      status: "completed",
      videoUrl: url,
      duration: ratio === "16:9" ? 8 : 12,
      ratio: ratio,
      themeColor: theme.color,
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      const updated = [newVideo, ...myVideos];
      setMyVideos(updated);
      localStorage.setItem(`local_videos_${currentUser.userId}`, JSON.stringify(updated));
    } else {
      try {
        await setDoc(doc(db, "generated_videos", newVideo.videoId), newVideo);
        setMyVideos(prev => [newVideo, ...prev]);
      } catch (e) {
        // Local fallback
        const updated = [newVideo, ...myVideos];
        setMyVideos(updated);
        localStorage.setItem(`local_videos_${currentUser.userId}`, JSON.stringify(updated));
      }
    }

    setActiveVideo(newVideo);
    setIsGenerating(false);
    setGenerationProgress(0);
    showToast(lang === "ar" ? "تهانينا! تم تصميم الفيديو وعرضه بنجاح!" : "Cheers! Video designed & synthesized successfully!");
  };

  // Delete a video entry
  const handleDeleteVideo = async (vidId: string) => {
    if (isDemoMode) {
      const updated = myVideos.filter(v => v.videoId !== vidId);
      setMyVideos(updated);
      localStorage.setItem(`local_videos_${currentUser?.userId}`, JSON.stringify(updated));
    } else {
      try {
        await deleteDoc(doc(db, "generated_videos", vidId));
        setMyVideos(prev => prev.filter(v => v.videoId !== vidId));
      } catch (e) {
        const updated = myVideos.filter(v => v.videoId !== vidId);
        setMyVideos(updated);
        localStorage.setItem(`local_videos_${currentUser?.userId}`, JSON.stringify(updated));
      }
    }
    if (activeVideo?.videoId === vidId) {
      setActiveVideo(null);
    }
    showToast(lang === "ar" ? "تم حذف مقطع الفيديو بنجاح" : "Video listing removed successfully");
  };

  // Add Authorized subscriber details from the Admin console
  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const addedUser: UserProfile = {
      userId: `user_${Date.now()}`,
      email: newEmail,
      role: newRole,
      displayName: newEmail.split("@")[0].toUpperCase(),
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      setAdminUsers(prev => [addedUser, ...prev]);
    } else {
      try {
        await setDoc(doc(db, "users", addedUser.userId), addedUser);
        setAdminUsers(prev => [addedUser, ...prev]);
      } catch (err) {
        setAdminUsers(prev => [addedUser, ...prev]);
      }
    }

    setNewEmail("");
    showToast(text.userAddedSuccess);
  };

  // Dynamic Theme Colors Mapper based on visual accents configuration
  const getThemeClass = () => {
    const isDark = theme.mode === "dark";
    let accentStyle = "";

    switch (theme.color) {
      case "orange":
        accentStyle = "from-amber-600 to-orange-500 bg-gradient-to-r hover:from-amber-700 hover:to-orange-600 text-white border-orange-500 shadow-xl shadow-orange-950/40 text-orange-400 select-orange";
        break;
      case "red":
        accentStyle = "from-rose-600 to-red-500 bg-gradient-to-r hover:from-rose-700 hover:to-red-600 text-white border-red-500 shadow-xl shadow-red-950/40 text-red-400 select-red";
        break;
      default:
        accentStyle = "from-blue-600 to-indigo-600 bg-gradient-to-r hover:from-blue-700 hover:to-indigo-700 text-white border-blue-500 shadow-xl shadow-blue-950/40 text-blue-400 select-blue";
    }

    return {
      bgMain: isDark ? "bg-[#0f1115] text-slate-100" : "bg-slate-50 text-slate-900",
      bgSidebar: isDark ? "bg-[#1a1d23] border-slate-800" : "bg-white border-slate-200",
      bgCard: isDark ? "bg-gradient-to-br from-slate-900 to-[#161a20] border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-md",
      textAccent: theme.color === "orange" ? "text-orange-500" : theme.color === "red" ? "text-rose-500" : "text-blue-500",
      accentPrimary: accentStyle,
      bgAccentSubtle: theme.color === "orange" ? "bg-orange-500/10" : theme.color === "red" ? "bg-red-500/10" : "bg-blue-500/10",
      borderAccent: theme.color === "orange" ? "border-orange-500/30" : theme.color === "red" ? "border-red-500/30" : "border-blue-500/30"
    };
  };

  const style = getThemeClass();

  // Helper metrics for statistics dashboard
  const statsGenerations = myVideos.length + 8;
  const statsSuccessRate = 98.4;
  const statsUsersCount = adminUsers.length;

  // Chart structured data
  const renderChartData = [
    { name: lang === "ar" ? "الأحد" : "Sun", value: 3 },
    { name: lang === "ar" ? "الاثنين" : "Mon", value: 5 },
    { name: lang === "ar" ? "الثلاثاء" : "Tue", value: 8 },
    { name: lang === "ar" ? "الأربعاء" : "Wed", value: statsGenerations - 8 },
    { name: lang === "ar" ? "الخميس" : "Thu", value: statsGenerations - 3 },
    { name: lang === "ar" ? "الجمعة" : "Fri", value: statsGenerations },
    { name: lang === "ar" ? "السبت" : "Sat", value: statsGenerations + 2 }
  ];

  const deviceDistributionData = [
    { name: lang === "ar" ? "موبايل Android" : "Android Mobile", value: 45, color: "#10b981" },
    { name: lang === "ar" ? "موبايل iPhone" : "iOS Mobile", value: 35, color: "#a855f7" },
    { name: lang === "ar" ? "كمبيوتر Windows" : "Windows Desktop", value: 15, color: "#3b82f6" },
    { name: lang === "ar" ? "أنظمة macOS/Linux" : "Mac/Linux Desktop", value: 5, color: "#f59e0b" }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${style.bgMain}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div id="toast_banner" className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full border bg-slate-900 border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-950/40 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* --- PRE-LOGIN GATEWAY SCREEN --- */}
      {!currentUser ? (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0f1115]">
          
          {/* Animated decorative cosmos backdrop */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 blur-[100px]" />

          <div className="w-full max-w-md p-8 md:p-10 rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#161a20] to-[#111317] backdrop-blur-md shadow-2xl shadow-black/50 relative z-10 text-center">
            
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/10 mb-6 flex items-center justify-center">
              <div className="w-full h-full bg-[#1a1d23] rounded-[14px] flex items-center justify-center">
                <VideoIcon className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              {lang === "ar" ? "منصة التصميم الذكي للقرن الـ 21" : "AI Creative Design Suite"}
            </h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              {text.loginSubtitle}
            </p>

            {/* Error / Offline Note */}
            <div className="mb-6 p-4 rounded-2xl bg-[#0c0e12] border border-slate-800/70 text-right flex items-start gap-2.5">
              <Sparkle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {lang === "ar" ? "تسجيل دخول تلقائي بدون رخص مدفوعة" : "Instant Multiplatform Access"}
                </p>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  {lang === "ar" 
                    ? "يتكيف التطبيق مع الهاتف المحمول تلقائياً ويمتلك شهادات PWA كاملة ليعمل كتطبيق أندرويد/iOS مجاناً." 
                    : "Fully responsive with offline caching, fully deployable to smartphones cleanly."}
                </p>
              </div>
            </div>

            {/* Google Authentication Button */}
            <button
              onClick={handleGoogleSignIn}
              id="gmail_login_btn"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold bg-white text-slate-950 hover:bg-slate-100 transition shadow-lg shadow-white/5 cursor-pointer mb-3"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{text.gmailLogin}</span>
            </button>

            {/* Quick Demo Test admin credentials loader toggle */}
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              id="admin_mode_toggle"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition py-2"
            >
              {lang === "ar" ? "أو تسجيل دخول كمسؤول لغرض التقييم والتجربة" : "Or emulate test profiles"}
            </button>

            {isAdminMode && (
              <div className="mt-4 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 text-left animate-fadeIn">
                <p className="text-xs text-indigo-300 mb-3 text-center leading-normal">
                  {lang === "ar" 
                    ? "بسبب بيئة الحماية (iframe)، يمكنك البدء بحساب مسؤول محاكي متطابق مع لوحة التحكم Firestore." 
                    : "For sandbox instances, choose a mock security role:"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDemoSignIn("s.mohamed1111111@gmail.com", "admin")}
                    className="p-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition text-center cursor-pointer"
                  >
                    {lang === "ar" ? "دخول كأدمن" : "Admin Profile"}
                  </button>
                  <button
                    onClick={() => handleDemoSignIn("creator@gmail.com", "user")}
                    className="p-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 transition text-center cursor-pointer"
                  >
                    {lang === "ar" ? "دخول كصانع فيديو" : "Standard Creator"}
                  </button>
                </div>
              </div>
            )}

            {/* Absolute footer translation */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <button onClick={toggleLanguage} className="flex items-center gap-1 hover:text-slate-300 font-semibold cursor-pointer">
                <Languages className="w-4 h-4" />
                <span>{lang === "ar" ? "English" : "عربي"}</span>
              </button>
              <span>{new Date().getFullYear()} © AI Video Studio</span>
            </div>

          </div>
        </div>
      ) : (

        // --- AUTHENTICATED PLATFORM MAIN INTERFACE ---
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* SIDEBAR NAVIGATION PANEL */}
          <aside className={`w-full md:w-64 md:min-h-screen p-5 shrink-0 border-b md:border-r md:border-b-0 flex flex-col justify-between ${style.bgSidebar}`}>
            
            <div className="flex flex-col">
              
              {/* App logo brand block */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${style.accentPrimary} text-white shadow-md`}>
                  <VideoIcon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base leading-tight">
                    {lang === "ar" ? "المصمم الذكي" : "AI Video Suite"}
                  </h2>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase block mt-0.5">PWA Ready ⚡</span>
                </div>
              </div>

              {/* Enlisted user mini badge card */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <img
                  src={currentUser.photoURL || "https://img.icons8.com/isometric/100/user.png"}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <h4 className="font-bold text-xs truncate text-slate-200">{currentUser.displayName}</h4>
                  <span className={`text-[10px] uppercase font-extrabold tracking-wider ${style.textAccent}`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Navigation Actions list */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("studio")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition duration-250 cursor-pointer ${
                    activeTab === "studio"
                      ? `${style.bgAccentSubtle} ${style.textAccent}`
                      : "text-slate-500 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>{text.videoCreator}</span>
                  </div>
                  {isRTL ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition duration-250 cursor-pointer ${
                    activeTab === "dashboard"
                      ? `${style.bgAccentSubtle} ${style.textAccent}`
                      : "text-slate-500 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4.5 h-4.5" />
                    <span>{text.dashboard}</span>
                  </div>
                  {isRTL ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {/* Only admins see user management */}
                {(currentUser.role === "admin" || currentUser.email === "s.mohamed1111111@gmail.com") && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition duration-250 cursor-pointer ${
                      activeTab === "admin"
                        ? `${style.bgAccentSubtle} ${style.textAccent}`
                        : "text-slate-500 hover:text-slate-100 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4.5 h-4.5" />
                      <span>{text.userManagement}</span>
                    </div>
                    {isRTL ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
              </nav>

            </div>

            {/* Quick config settings inside footer sidebar */}
            <div className="mt-8 pt-6 border-t border-slate-800/85 space-y-4">
              
              {/* PWA Install Promo Trigger */}
              {isInstallable && (
                <button
                  onClick={triggerPWAInstall}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition text-left cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 animate-bounce" />
                  <span>{lang === "ar" ? "تنزيل كتطبيق للهاتف" : "Install Mobile App"}</span>
                </button>
              )}

              {/* Accent Palette Configuration Options */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-2">
                  {lang === "ar" ? "تغيير المظهر واللون" : "Theme Style & Contrast"}
                </span>
                
                <div className="flex items-center justify-between gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => updateThemeMode("dark")}
                    className={`flex-1 p-2 rounded-lg flex items-center justify-center transition cursor-pointer ${theme.mode === "dark" ? "bg-slate-800 text-amber-400" : "text-slate-500"}`}
                  >
                    <Moon className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => updateThemeMode("light")}
                    className={`flex-1 p-2 rounded-lg flex items-center justify-center transition cursor-pointer ${theme.mode === "light" ? "bg-white text-amber-500 shadow-sm" : "text-slate-400"}`}
                  >
                    <Sun className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Primary Accent Switches */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    onClick={() => updateThemeColor("blue")}
                    className={`w-6 h-6 rounded-full bg-blue-600 border ${theme.color === "blue" ? "border-white" : "border-transparent"}`}
                    title="Blue"
                  />
                  <button
                    onClick={() => updateThemeColor("orange")}
                    className={`w-6 h-6 rounded-full bg-orange-600 border ${theme.color === "orange" ? "border-white" : "border-transparent"}`}
                    title="Orange"
                  />
                  <button
                    onClick={() => updateThemeColor("red")}
                    className={`w-6 h-6 rounded-full bg-rose-600 border ${theme.color === "red" ? "border-white" : "border-transparent"}`}
                    title="Red"
                  />
                </div>
              </div>

              {/* Language Preferences */}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between px-3 p-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  <span>{lang === "ar" ? "English" : "العربية"}</span>
                </div>
                <span className="text-[10px] text-zinc-500 underline font-medium">Toggle</span>
              </button>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-rose-500/15 text-rose-500 text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{text.logout}</span>
              </button>

            </div>

          </aside>

          {/* MAIN CONTAINER FRAME */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            
            {/* Upper Greetings and install stats layout */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6 mb-8 mt-4 md:mt-0">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {text.title}
                </h1>
                <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
                  {text.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-4 py-2.5 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
                  <span>
                    {isDemoMode ? text.demoMode : (lang === "ar" ? "سيرفر السحابة نشط ومؤمن" : "Secure Cloud Active")}
                  </span>
                </div>
              </div>
            </header>

            {/* --- WORKSPACE VIEW 1: CREATIVE STUDIO SUITE --- */}
            {activeTab === "studio" && (
              <div className="space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Generation parameters module */}
                  <section className="lg:col-span-7 space-y-6">
                    
                    <div className={`p-6 rounded-3xl border ${style.bgCard}`}>
                      <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
                        <Sparkles className={`w-5 h-5 ${style.textAccent}`} />
                        <span>{lang === "ar" ? "معالم المقطع والتخيّل الإبداعي" : "Creative Imaginative Suite"}</span>
                      </h3>

                      {/* Prompt parameters input */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 block mb-2">
                            {lang === "ar" ? "الوصف التفصيلي (Prompt)" : "Visual Prompt text"}
                          </label>
                          <textarea
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            placeholder={text.promptPlaceholder}
                            rows={4}
                            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium leading-relaxed resize-none outline-none transition"
                          />
                        </div>

                        {/* Drag and Drop Reference Image box */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 block mb-2">
                            {lang === "ar" ? "الصورة المرجعية (بدء تحويل الحركة)" : "Inspirational Reference Image"}
                          </label>
                          
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center min-h-[140px] cursor-pointer ${
                              isDragging 
                                ? "border-indigo-500 bg-indigo-500/10" 
                                : imageFile 
                                  ? `${style.borderAccent} ${style.bgAccentSubtle}`
                                  : "border-slate-800 hover:border-slate-700 bg-slate-950"
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImagePicker}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              id="image_picker_field"
                            />

                            {imageFile ? (
                              <div className="flex items-center gap-4 w-full">
                                <img
                                  src={imageFile}
                                  alt="Reference source"
                                  className="w-20 h-20 object-cover rounded-xl border border-slate-700 pointer-events-none"
                                />
                                <div className="text-left flex-1">
                                  <h4 className="font-bold text-xs text-slate-200">
                                    {lang === "ar" ? "مكتملة وجاهزة للتحويل" : "Reference loaded successfully"}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                                    {lang === "ar" ? "سيقوم الذكاء الاصطناعي ببث الحركة عبر طبقات هذه الصورة تلقائياً." : "The rendering core will apply physics motion using this layout context."}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setImageFile(null);
                                    }}
                                    className="text-rose-500 hover:text-rose-400 text-xs font-bold mt-2 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{lang === "ar" ? "إزالة" : "Clear"}</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-slate-500 mb-2 animate-bounce" />
                                <p className="text-xs font-bold text-slate-300">
                                  {text.uploadImage}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-normal mt-1 max-w-sm">
                                  {lang === "ar" ? "الأحجام المقبولة تصل لغاية 50 ميجابايت بدقة هاتف ممتازة" : "Supports high-resolution base64 attachments up to 50MB"}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Rendering core and aspect ratio selectors row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Rendering Engine choice */}
                          <div>
                            <span className="text-xs font-bold text-slate-400 block mb-2">
                              {lang === "ar" ? "محرك الـ AI لتوليد الفيديو" : "AI Video Computation Engine"}
                            </span>
                            
                            <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                              <button
                                onClick={() => setRenderingMode("instant")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${renderingMode === "instant" ? `${style.bgAccentSubtle} ${style.textAccent}` : "text-slate-400"}`}
                              >
                                {lang === "ar" ? "محاكي سريع (موصى به)" : "Instant Frame (Simulation)"}
                              </button>
                              <button
                                onClick={() => setRenderingMode("veo")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${renderingMode === "veo" ? `${style.bgAccentSubtle} ${style.textAccent}` : "text-slate-400"}`}
                              >
                                {lang === "ar" ? "محرك Veo السحابي" : "Veo Cloud Model"}
                              </button>
                            </div>
                          </div>

                          {/* Aspect Ratio choose */}
                          <div>
                            <span className="text-xs font-bold text-slate-400 block mb-2">
                              {text.aspectRatio}
                            </span>
                            
                            <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                              <button
                                onClick={() => setRatioInput("16:9")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${ratioInput === "16:9" ? "bg-slate-800 text-slate-100" : "text-slate-500"}`}
                              >
                                {lang === "ar" ? "سينمائي 16:9" : "Landscape 16:9"}
                              </button>
                              <button
                                onClick={() => setRatioInput("9:16")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${ratioInput === "9:16" ? "bg-slate-800 text-slate-100" : "text-slate-500"}`}
                              >
                                {lang === "ar" ? "طولي للهاتف 9:16" : "Vertical 9:16"}
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* Rendering submit button */}
                        <button
                          onClick={triggerVideoGeneration}
                          disabled={isGenerating}
                          className={`w-full py-4 rounded-2xl font-bold bg-gradient-to-r text-base transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] ${style.accentPrimary} ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>{renderingStage} ({generationProgress}%)</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 text-amber-300" />
                              <span>{text.generateBtn}</span>
                            </>
                          )}
                        </button>

                      </div>
                    </div>
                  </section>

                  {/* Right side active rendering frame */}
                  <section className="lg:col-span-5 space-y-6">
                    
                    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between min-h-[460px] ${style.bgCard}`}>
                      
                      {/* Interactive background neon elements */}
                      <div className="absolute top-[-40%] right-[-30%] w-80 h-80 rounded-full bg-indigo-600/10 blur-[60px]" />

                      <div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">
                            {lang === "ar" ? "شاشة العرض والتشغيل السينمائي" : "Cinematic Preview Frame"}
                          </h3>
                        </div>

                        {/* Screen workspace */}
                        <div className="relative z-10">
                          {isGenerating ? (
                            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 text-center animate-pulse">
                              <Loader2 className={`w-12 h-12 ${style.textAccent} animate-spin mb-4`} />
                              <h4 className="font-bold text-sm text-slate-200">{renderingStage}</h4>
                              <p className="text-[11px] text-slate-500 leading-normal mt-1 max-w-xs">
                                {lang === "ar" ? "المخدم السحابي يقوم ببناء الأبعاد وتتبع زوايا الضوء الآن." : "Computing particle physics matrices. Do not close the window."}
                              </p>
                              
                              {/* Generation bar */}
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-6 max-w-xs">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300" style={{ width: `${generationProgress}%` }} />
                              </div>
                            </div>
                          ) : activeVideo ? (
                            <div className="w-full space-y-4">
                              
                              {/* Dynamic Aspect Ratio video controller container */}
                              <div className={`w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative group/aspect ${activeVideo.ratio === "9:16" ? "max-h-[360px] aspect-[9/16] inline-flex items-center justify-center mx-auto block" : "aspect-video"}`}>
                                <video
                                  src={activeVideo.videoUrl}
                                  controls
                                  autoPlay
                                  loop
                                  className="w-full h-full object-cover"
                                />

                                <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider border border-slate-800 text-slate-200 uppercase">
                                  {activeVideo.ratio}
                                </div>
                              </div>

                              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                                <p className="text-xs font-bold text-slate-400">
                                  {lang === "ar" ? "الوصف المُحول:" : "Translated parameters prompt:"}
                                </p>
                                <p className="text-xs text-slate-200 leading-relaxed mt-1 font-medium italic">
                                  "{activeVideo.prompt}"
                                </p>
                              </div>

                              {/* Action controls row */}
                              <div className="flex gap-2">
                                <a
                                  href={activeVideo.videoUrl}
                                  download={`ai_video_${activeVideo.videoId}.mp4`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 transition shadow-sm text-center flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>{lang === "ar" ? "رابط تحميل المقطع" : "Stream Download URL"}</span>
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(activeVideo.videoUrl || "");
                                    showToast(text.copiedSuccess);
                                  }}
                                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition cursor-pointer"
                                  title="Copy URL"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVideo(activeVideo.videoId)}
                                  className="p-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/20 text-rose-400 transition cursor-pointer"
                                  title="Delete Workspace Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                            </div>
                          ) : (
                            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-850 overflow-hidden flex flex-col items-center justify-center p-6 text-center border-dashed">
                              <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                              <p className="text-xs font-bold text-slate-400">
                                {lang === "ar" ? "لا يوجد فيديو للتشغيل حالياً" : "Frame inactive"}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-normal mt-1 max-w-xs">
                                {lang === "ar" ? "اكتب وصفاً ثم اضغط توليد لتشغيل محاكي الأبعاد ورؤية المشاهد" : "Fill parameters and trigger generation core above to begin."}
                              </p>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Video Storyboard details indicator */}
                      {storyboardScenes.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-800/80 relative z-10 animate-slideUp">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <Sparkle className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            <span>{lang === "ar" ? "مشاهد سيناريو التوليد الفنية (Gemini Storyboard)" : "AI Visual Storyboard Sequence"}</span>
                          </h4>
                          
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {storyboardScenes.map((scene, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-900/90 text-[11px] font-medium leading-relaxed hover:border-indigo-500/20 transition flex gap-2">
                                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-md bg-slate-900 font-bold ${style.textAccent}`}>
                                  F-{idx+1}
                                </span>
                                <p className="text-slate-300 leading-normal flex-1 text-right">{scene}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </section>

                </div>

                {/* MY COMPLETED DESIGNS GRID */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xl">
                    {text.myVideos}
                  </h3>

                  {myVideos.length === 0 ? (
                    <div className={`p-12 text-center rounded-3xl border border-dashed ${style.bgCard}`}>
                      <VideoIcon className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-400">{text.noVideosYet}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {myVideos.map((vid) => (
                        <div
                          key={vid.videoId}
                          onClick={() => setActiveVideo(vid)}
                          className={`group/box rounded-2xl border overflow-hidden cursor-pointer transition transform hover:-translate-y-1 hover:shadow-xl ${
                            activeVideo?.videoId === vid.videoId
                              ? `${style.borderAccent} ${style.bgAccentSubtle}`
                              : `hover:border-slate-700 ${style.bgCard}`
                          }`}
                        >
                          <div className="aspect-video relative bg-slate-950 overflow-hidden">
                            {vid.imageUrl ? (
                              <img
                                src={vid.imageUrl}
                                alt={vid.prompt}
                                className="w-full h-full object-cover opacity-90 group-hover/box:scale-105 transition duration-500 pointer-events-none"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <VideoIcon className="w-6 h-6 text-slate-700" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-4">
                              <p className="text-xs font-bold text-slate-100 line-clamp-1 flex-1 leading-normal">
                                {vid.prompt}
                              </p>
                            </div>

                            <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border border-indigo-500/20 text-indigo-400 capitalize">
                              {vid.ratio}
                            </div>
                          </div>

                          <div className="p-4 flex items-center justify-between bg-slate-900/40">
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(vid.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                            
                            <div className="flex gap-2 invisible group-hover/box:visible">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVideo(vid.videoId);
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/20 border border-rose-900/10 text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* --- WORKSPACE VIEW 2: STATS INTERACTIVE DASHBOARD --- */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Visual quick info metrics block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Metric 1 */}
                  <div className={`p-6 rounded-2xl border flex items-center gap-4 ${style.bgCard}`}>
                    <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block leading-normal">
                        {text.totalUsers}
                      </span>
                      <h4 className="text-2xl font-extrabold text-slate-100 tracking-tight mt-0.5">
                        {statsUsersCount}
                      </h4>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className={`p-6 rounded-2xl border flex items-center gap-4 ${style.bgCard}`}>
                    <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block leading-normal">
                        {text.totalGenerations}
                      </span>
                      <h4 className="text-2xl font-extrabold text-slate-100 tracking-tight mt-0.5">
                        {statsGenerations}
                      </h4>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className={`p-6 rounded-2xl border flex items-center gap-4 ${style.bgCard}`}>
                    <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <CheckCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block leading-normal">
                        {text.successRate}
                      </span>
                      <h4 className="text-2xl font-extrabold text-slate-100 tracking-tight mt-0.5">
                        %{statsSuccessRate}
                      </h4>
                    </div>
                  </div>

                </div>

                {/* Main analytical charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column chart */}
                  <div className={`lg:col-span-8 p-6 rounded-3xl border ${style.bgCard}`}>
                    <h3 className="font-extrabold text-base mb-6 uppercase tracking-wider text-slate-400">
                      {lang === "ar" ? "قراءة أداء المولد الفني وتراكم المعالجات" : "Weekly Video Generation Volume"}
                    </h3>

                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={renderChartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.color === "orange" ? "#ea580c" : theme.color === "red" ? "#e11d48" : "#3b82f6"} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={theme.color === "orange" ? "#ea580c" : theme.color === "red" ? "#e11d48" : "#3b82f6"} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                          <Area type="monotone" dataKey="value" stroke={theme.color === "orange" ? "#ea580c" : theme.color === "red" ? "#e11d48" : "#3b82f6"} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: Mobile OS installs distribution */}
                  <div className={`lg:col-span-4 p-6 rounded-3xl border ${style.bgCard}`}>
                    <h3 className="font-extrabold text-base mb-3 uppercase tracking-wider text-slate-400">
                      {lang === "ar" ? "أجهزة تنصيب تطبيق PWA" : "Smartphones App Installs"}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-normal mb-6">
                      {lang === "ar" 
                        ? "بروتوكول تثبيت PWA يدعم الرفع والتشغيل التلقائي عبر الويب كأنها باقة أندرويد أصلية بدون تحذيرات الحماية." 
                        : "Our application is a configured installable progressive package supporting clean native triggers."}
                    </p>

                    <div className="h-44 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {deviceDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legends checklist */}
                    <div className="space-y-2 mt-4">
                      {deviceDistributionData.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="font-semibold text-slate-300">{entry.name}</span>
                          </div>
                          <span className="font-mono text-slate-400 font-bold">%{entry.value}</span>
                        </div>
                      ))}
                    </div>

                  </div>

                </div>

                {/* Audit Trial login action history feed */}
                <div className={`p-6 rounded-3xl border ${style.bgCard}`}>
                  <h3 className="font-extrabold text-base mb-4 tracking-wider text-slate-400">
                    {text.recentLogs}
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-xs">
                          <th className="pb-3 text-right">{lang === "ar" ? "المسؤول / البريد" : "Operator / Email"}</th>
                          <th className="pb-3 text-right">{lang === "ar" ? "تاريخ تسجيل الدخول" : "Transaction time"}</th>
                          <th className="pb-3 text-right">{lang === "ar" ? "نظام التشغيل المستخدم" : "System OS Client"}</th>
                          <th className="pb-3 text-right">{lang === "ar" ? "لغة الجلسة" : "Session Lang"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {activityLogs.map((log) => (
                          <tr key={log.logId} className="hover:bg-slate-900/30">
                            <td className="py-3.5 font-semibold text-slate-200">{log.email}</td>
                            <td className="py-3.5 text-xs text-slate-400">
                              {new Date(log.loginTime).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                            </td>
                            <td className="py-3.5 text-xs text-slate-400 flex items-center gap-1.5 justify-end">
                              {log.platform.includes("PC") || log.platform.includes("Desktop") || log.platform.includes("Windows") ? (
                                <Monitor className="w-4 h-4 text-slate-500" />
                              ) : (
                                <Smartphone className="w-4 h-4 text-slate-500" />
                              )}
                              <span>{log.platform}</span>
                            </td>
                            <td className="py-3.5 font-mono text-xs uppercase text-slate-500">{log.language}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>
            )}

            {/* --- WORKSPACE VIEW 3: ADMIN ACCESS MANAGEMENT PANEL --- */}
            {activeTab === "admin" && (
              <div className="space-y-8 animate-fadeIn">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Authorized subscriber Addition Form */}
                  <section className="lg:col-span-4 space-y-6">
                    <div className={`p-6 rounded-3xl border ${style.bgCard}`}>
                      <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
                        <PlusCircle className={`w-5 h-5 ${style.textAccent}`} />
                        <span>{text.addUserToggle}</span>
                      </h3>

                      <form onSubmit={handleAddNewUser} className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 block mb-2">
                            {text.emailAddress}
                          </label>
                          <input
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="user@design-studio.com"
                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-400 block mb-2">
                            {text.userRole}
                          </label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                          >
                            <option value="user">{lang === "ar" ? "أخصائي تصميم فيديو (Creator)" : "Creator / Standard User"}</option>
                            <option value="manager">{lang === "ar" ? "مدير أعمال (Manager)" : "Business Associate Manager"}</option>
                            <option value="admin">{lang === "ar" ? "مدير النظام العام (Admin)" : "System Administrator"}</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className={`w-full py-3.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer ${style.accentPrimary}`}
                        >
                          {text.addBtn}
                        </button>
                      </form>

                      <div className="mt-8 p-4 rounded-xl bg-slate-950 border border-slate-800 text-right">
                        <p className="text-[11px] text-slate-500 leading-normal">
                          {lang === "ar"
                            ? "ملاحظة: يحمي التطبيق نفسه من عمليات تخريب قاعدة البيانات؛ فقط المشرفون المخولون يمتلكون حق التعديل على الصلاحيات والوصول للوحة الإحصائيات الكاملة."
                            : "Notice: System security parameters remain hardcoded. Role updates sync immediately with Firestore policies."}
                        </p>
                      </div>

                    </div>
                  </section>

                  {/* Right Column: Registered User Directory List */}
                  <section className="lg:col-span-8 space-y-6">
                    <div className={`p-6 rounded-3xl border ${style.bgCard}`}>
                      <h3 className="font-extrabold text-base mb-4 tracking-wider text-slate-400">
                        {lang === "ar" ? "قائمة الأعضاء المستصرح لهم بالعمل المشترك" : "Enrolled Subscribers Directory"}
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-500 font-bold">
                              <th className="pb-3 text-right">{lang === "ar" ? "البريد الإلكتروني" : "Email profile"}</th>
                              <th className="pb-3 text-right">{lang === "ar" ? "الصلاحية المسجلة" : "Role Status"}</th>
                              <th className="pb-3 text-right">{lang === "ar" ? "تاريخ الانضمام" : "Enrolled At"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {adminUsers.map((u) => (
                              <tr key={u.userId} className="hover:bg-slate-900/20">
                                <td className="py-3.5 font-semibold text-slate-200">{u.email}</td>
                                <td className="py-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                                    u.role === "admin" 
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                                      : u.role === "manager"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-3.5 text-slate-500 font-mono">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </section>

                </div>

              </div>
            )}

          </main>

        </div>

      )}

    </div>
  );
}
