export type LanguageMode = "ar" | "en";
export type ThemeMode = "dark" | "light";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  language: LanguageMode;
  theme: ThemeMode;
  createdAt: string;
}

export type ReportType = "login" | "text-to-image" | "image-to-video" | "text-to-speech";

export interface Report {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  type: ReportType;
  prompt: string;
  resultUrl: string;
  timestamp: string;
  language: string;
}

export interface LocalizationType {
  title: string;
  subtitle: string;
  loginTitle: string;
  loginDesc: string;
  loginGoogle: string;
  loginAdminToggle: string;
  loginAdminUser: string;
  loginAdminPass: string;
  loginBtn: string;
  errorMsg: string;
  dashboardTitle: string;
  dashboardDesc: string;
  reportsTitle: string;
  reportsCount: string;
  reportsFilterAll: string;
  reportsFilterTextToImage: string;
  reportsFilterImageToVideo: string;
  reportsFilterTextToSpeech: string;
  reportDetailTitle: string;
  exportExel: string;
  exportPdf: string;
  activeUsers: string;
  activeUsersCount: string;
  toolTextToImage: string;
  toolImageToVideo: string;
  toolTextToSpeech: string;
  promptPlaceholderImage: string;
  promptPlaceholderVideo: string;
  promptPlaceholderSpeech: string;
  generateBtn: string;
  voiceLabel: string;
  aspectRatioLabel: string;
  historyTitle: string;
  logoutBtn: string;
  loading: string;
  errorOccurred: string;
  copied: string;
  noReports: string;
}

export const ARABIC_TRANSLATION: LocalizationType = {
  title: "منصة المبدع الذكي المتقدمة",
  subtitle: "أدوات متكاملة لتوليد الصور والفيديوهات والكلام بالذكاء الاصطناعي",
  loginTitle: "تسجيل الدخول",
  loginDesc: "يرجى تسجيل الدخول للوصول إلى أدوات الذوق الإبداعي ولوحة التحكم.",
  loginGoogle: "تسجيل دخول بواسطة حساب Google",
  loginAdminToggle: "دخول كمسؤول أو حساب تجريبي",
  loginAdminUser: "اسم المستخدم / البريد الإلكتروني",
  loginAdminPass: "كلمة المرور",
  loginBtn: "دخول آمن",
  errorMsg: "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  dashboardTitle: "لوحة التحكم الذكية",
  dashboardDesc: "تقارير مباشرة لحركة الدخول واستخدام تقنيات التوليد",
  reportsTitle: "سجل العمليات والتحليلات",
  reportsCount: "إجمالي العمليات الموثقة",
  reportsFilterAll: "الكل",
  reportsFilterTextToImage: "توليد صور",
  reportsFilterImageToVideo: "توليد فيديو",
  reportsFilterTextToSpeech: "تحويل نص لصوت",
  reportDetailTitle: "تفاصيل العملية والمستخدم",
  exportExel: "تصدير Excel (CSV)",
  exportPdf: "تصدير تقرير PDF مبسط",
  activeUsers: "المشتركون النشطون",
  activeUsersCount: "مستخدم نشط بالمنصة",
  toolTextToImage: "تحويل النص إلى صورة (Text ➔ Image)",
  toolImageToVideo: "توليد فيديو من صورة ونفس (Image ➔ Video)",
  toolTextToSpeech: "تحويل النص إلى صوت (Text ➔ Speech)",
  promptPlaceholderImage: "مثال: رائد فضاء يركب حصاناً على المريخ، سينمائي، دقة عالية...",
  promptPlaceholderVideo: "مثال: جعل النار تتوهج وجعل الرائد يلوح بيده بحركة طبيعية...",
  promptPlaceholderSpeech: "اكتب هنا النص المراد تحويله إلى صوت بنبرة طبيعية وواضحة...",
  generateBtn: "ابدأ عملية التوليد الآن",
  voiceLabel: "اختر طيف الصوت",
  aspectRatioLabel: "نسبة العرض للارتفاع",
  historyTitle: "سجل عملياتك الأخيرة",
  logoutBtn: "تسجيل خروج",
  loading: "جاري المعالجة... قد يستغرق توليد الفيديوهات الالتزام ببضع دقائق...",
  errorOccurred: "فشلت العملية: ",
  copied: "تم النسخ بنجاح!",
  noReports: "لا يوجد سجل عمليات مسجل حتى الآن."
};

export const ENGLISH_TRANSLATION: LocalizationType = {
  title: "Smart Creator AI Suite",
  subtitle: "Integrated professional suite for Image, Video, and Voice generation",
  loginTitle: "Access Portal",
  loginDesc: "Log in using the secure gateway to access the dashboard and generator suite.",
  loginGoogle: "Continue with Google Account",
  loginAdminToggle: "Sign in with Admin / Test Credentials",
  loginAdminUser: "Username or Email",
  loginAdminPass: "Password",
  loginBtn: "Secure Sign In",
  errorMsg: "An error occurred, please attempt again.",
  dashboardTitle: "Interactive Dashboard",
  dashboardDesc: "Live telemetry of portal access and active engine utilization",
  reportsTitle: "Operations Logs & Telemetry",
  reportsCount: "Total Documented Runs",
  reportsFilterAll: "All Logs",
  reportsFilterTextToImage: "Text ➔ Image",
  reportsFilterImageToVideo: "Image ➔ Video",
  reportsFilterTextToSpeech: "Text ➔ Speech",
  reportDetailTitle: "Operation Details",
  exportExel: "Export CSV (Excel)",
  exportPdf: "Export Simple PDF Report",
  activeUsers: "Active Accounts",
  activeUsersCount: "active accounts on platform",
  toolTextToImage: "Text to Image Generation",
  toolImageToVideo: "Image + Prompt to Video",
  toolTextToSpeech: "Advanced Text-To-Speech",
  promptPlaceholderImage: "e.g. A neon cyberpunk cat skating on vaporwave tracks, cinematic 4k...",
  promptPlaceholderVideo: "e.g. Make the lights flicker and the cat perform a kickflip smoothly...",
  promptPlaceholderSpeech: "Type the phrases to synthesize into crisp voice output...",
  generateBtn: "Trigger Creative Engine",
  voiceLabel: "Choose Accent Voice",
  aspectRatioLabel: "Screen Aspect Ratio",
  historyTitle: "Your Creative Journey",
  logoutBtn: "Sign Out",
  loading: "Processing creative assets... Video generation may take a few minutes...",
  errorOccurred: "Generation failed: ",
  copied: "Copied safely!",
  noReports: "No operations generated yet."
};
