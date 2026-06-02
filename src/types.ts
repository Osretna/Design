/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "admin" | "manager" | "user";

export interface UserProfile {
  userId: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  addedBy?: string;
}

export interface LoginLog {
  logId: string;
  userId: string;
  email: string;
  loginTime: string;
  platform: string;
  language: string;
}

export interface GeneratedVideo {
  videoId: string;
  userId: string;
  prompt: string;
  imageUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  duration?: number;
  ratio: "16:9" | "9:16";
  themeColor?: string;
  createdAt: string;
}

export type ThemeMode = "light" | "dark";
export type ThemeColor = "blue" | "orange" | "red";

export interface ThemeConfig {
  mode: ThemeMode;
  color: ThemeColor;
}

export type Language = "ar" | "en";

export interface TranslationSet {
  title: string;
  subtitle: string;
  loginTitle: string;
  loginSubtitle: string;
  gmailLogin: string;
  adminLogin: string;
  dashboard: string;
  videoCreator: string;
  userManagement: string;
  logout: string;
  languageLabel: string;
  themeLabel: string;
  colorPrimary: string;
  colorOrange: string;
  colorRed: string;
  promptPlaceholder: string;
  uploadImage: string;
  aspectRatio: string;
  generateBtn: string;
  myVideos: string;
  allVideos: string;
  statsTitle: string;
  totalUsers: string;
  totalGenerations: string;
  successRate: string;
  recentLogs: string;
  addUserToggle: string;
  emailAddress: string;
  userRole: string;
  addBtn: string;
  statusPending: string;
  statusProcessing: string;
  statusCompleted: string;
  statusFailed: string;
  copiedSuccess: string;
  downloadVideo: string;
  noVideosYet: string;
  enterPromptAlert: string;
  adminRequired: string;
  userAddedSuccess: string;
  welcomeBack: string;
  durationLabel: string;
  demoMode: string;
}

export const translations: Record<Language, TranslationSet> = {
  ar: {
    title: "منصة الفيديو الذكية",
    subtitle: "تطبيق ويب متكامل مصمم خصيصاً لتصميم الفيديوهات من الصور والنصوص بالذكاء الاصطناعي",
    loginTitle: "مرحباً بك في منصة التصميم الراقية",
    loginSubtitle: "سجل الدخول باستخدام Gmail أو حساب المشرف للبدء في الإبداع وتصميم الفيديوهات",
    gmailLogin: "تسجيل الدخول التلقائي عبر Gmail",
    adminLogin: "تسجيل دخول كمسؤول",
    dashboard: "لوحة التحكم والتنبؤات",
    videoCreator: "مصمم الفيديوهات",
    userManagement: "صلاحيات الأعضاء",
    logout: "تسجيل الخروج",
    languageLabel: "اللغة",
    themeLabel: "المظهر",
    colorPrimary: "محيط أزرق",
    colorOrange: "واحة برتقالية",
    colorRed: "ياقوت أحمر",
    promptPlaceholder: "اكتب الوصف التفصيلي للفيديو الذي تتطلع لتصميمه... (مثال: شلالات نيون خيالية تنبض بالحياة، دقة سينمائية)",
    uploadImage: "اسحب الصورة أو اضغط لرفعها كمرجع للذكاء الاصطناعي",
    aspectRatio: "أبعاد الشاشة",
    generateBtn: "تحويل الصورة ووصفك إلى فيديو سينمائي",
    myVideos: "تصميماتي الإبداعية",
    allVideos: "إجمالي التصاميم بالمنصة",
    statsTitle: "إحصائيات وقراءات تفاعلية",
    totalUsers: "إجمالي الأعضاء والمستخدمين",
    totalGenerations: "الفيديوهات المصممة",
    successRate: "نسبة النجاح والاستقرار",
    recentLogs: "سجل الأنشطة ودخول المستخدمين الأخير",
    addUserToggle: "إضافة عضو جديد ومستصرح له بالدخول",
    emailAddress: "البريد الإلكتروني للأعضاء الجدد",
    userRole: "الرتبة / الصلاحية",
    addBtn: "إضافة واعتماد العضو",
    statusPending: "في قائمة الانتظار",
    statusProcessing: "يجري الإنتاج والتصميم...",
    statusCompleted: "مكتمل وجاهز للتحميل",
    statusFailed: "عذراً، فشل التحويل",
    copiedSuccess: "تم نسخ الرابط بنجاح!",
    downloadVideo: "تحميل مقطع الفيديو",
    noVideosYet: "لا توجد فيديوهات مصممة حتى الآن. ابدأ بكتابة فكرتك وصمم أول فيديو تفاعلي!",
    enterPromptAlert: "الرجاء كتابة وصف تفصيلي وتحديد صورة مرجعية أولاً!",
    adminRequired: "تنويه: يتطلب هذا تبديل الوضع للأدمن أو استخدام بريد معتمد.",
    userAddedSuccess: "تم إضافة العضو بنجاح وتخصيص الصلاحيات المستهدفة!",
    welcomeBack: "مرحباً بعودتك صانع المحتوى المبدع!",
    durationLabel: "مدة العرض بالفيديو",
    demoMode: "وضع المحاكاة"
  },
  en: {
    title: "AI Intelligent Video Suite",
    subtitle: "A fully unified Web Platform designed to instantly transform images & descriptions into high-fidelity cinematic video clips.",
    loginTitle: "Welcome to AI Video Studio",
    loginSubtitle: "Seamlessly authenticate using Gmail or Admin credentials to start designing stunning videos",
    gmailLogin: "Auto-Login with Gmail (OAuth)",
    adminLogin: "Sign In as Administrator",
    dashboard: "Interactive Insights",
    videoCreator: "Video Studio",
    userManagement: "Access Management",
    logout: "Sign Out",
    languageLabel: "Language",
    themeLabel: "Appearance",
    colorPrimary: "Ocean Blue",
    colorOrange: "Oasis Orange",
    colorRed: "Ruby Crimson",
    promptPlaceholder: "Describe your video vision in detail... (e.g. Neon waterfalls in a fantasy forest, slow motion, cinematic 4k style)",
    uploadImage: "Drag and drop or click to upload Reference Photo",
    aspectRatio: "Aspect Ratio",
    generateBtn: "Convert Image and Prompt to Cinematic Video",
    myVideos: "My Creative Designs",
    allVideos: "All Workspace Designs",
    statsTitle: "Live Interactive Report Dashboard",
    totalUsers: "Enrolled Subscribers",
    totalGenerations: "Crafted AI Videos",
    successRate: "Generation Stability",
    recentLogs: "Activity Records & Login Insights",
    addUserToggle: "Enlist New Authorized Subscriber",
    emailAddress: "Subscriber's Email Address",
    userRole: "Security Privilege Layer",
    addBtn: "Enlist Workspace User",
    statusPending: "Queued",
    statusProcessing: "AI Rendering Video...",
    statusCompleted: "Finished & Ready",
    statusFailed: "Rendering Failed",
    copiedSuccess: "URL copied cleanly!",
    downloadVideo: "Download Animation File",
    noVideosYet: "No creations rendered yet. Kick off your first workspace session now!",
    enterPromptAlert: "Please fill in a detailed descriptive prompt and upload a reference photo!",
    adminRequired: "Security alert: Admin permissions or trusted domain required.",
    userAddedSuccess: "Successful. Authorized user profile created with specific privileges!",
    welcomeBack: "Welcome back, creative workspace artist!",
    durationLabel: "Video Timeline Duration",
    demoMode: "Simulation Engine ACTIVE"
  }
};
