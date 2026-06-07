import React, { useEffect, useState } from "react";
import { 
  Search, Filter, ShoppingBag, TrendingUp, Sparkles, Star, 
  MapPin, CheckCircle, Download, Dumbbell, ArrowRight, ArrowLeft,
  Briefcase, Award, Zap, Heart, MessageSquare, Plus, Minus, Trash2, X
} from "lucide-react";
import { Product, CartItem, Order, StoreSettings } from "./types";
import { getProducts, getStoreSettings, addOrder, getOrders } from "./firebase";
import { Smartphone, Truck, ShieldAlert, Navigation, Clock, PackageCheck } from "lucide-react";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import AdminPanel from "./components/AdminPanel";
import MapPicker from "./components/MapPicker";

export default function App() {
  // Locale & Theme choices cached in localStorage
  const [language, setLanguage] = useState<"ar" | "en">(() => {
    return (localStorage.getItem("store_lang") as "ar" | "en") || "ar";
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("store_dark_mode") === "true";
  });

  // Database States
  const [settings, setSettings] = useState<StoreSettings>({
    storeNameAr: "لياقة برو",
    storeNameEn: "Fit Pro Arena",
    storeLogo: "",
    adminWhatsapp: "201012345678"
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart & checkout UI overlays
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [recentOrderId, setRecentOrderId] = useState("");

  // Filtering states
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // PWA deferring prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaInstallBtn, setShowPwaInstallBtn] = useState(false);

  // New Interactive Professional additions states
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [orderSearchVal, setOrderSearchVal] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Checkout inputs
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    address: "",
    coords: null as { lat: number; lng: number } | null
  });

  // Interactive Testimonial Ratings
  const [ratings, setRatings] = useState<{ name: string; score: number; comment: string; date: string }[]>(() => {
    const saved = localStorage.getItem("store_user_ratings");
    return saved ? JSON.parse(saved) : [
      { name: "أحمد منصور", score: 5, comment: "الأثقال ممتازة وسرعة التوصيل خيالية، شكراً لكم على الاحترافية.", date: "2026-06-01" },
      { name: "John Doe", score: 5, comment: "Extremely professional sports mat! Easy delivery coordination.", date: "2026-06-03" },
      { name: "سارة العتيبي", score: 4, comment: "الحذاء خفيف الوزن ومناسب للتمرين، التقييم 4 نجوم.", date: "2026-06-05" }
    ];
  });

  const [newSurveyRating, setNewSurveyRating] = useState({
    score: 5,
    comment: ""
  });

  const isAr = language === "ar";
  const directionClass = isAr ? "rtl" : "ltr";

  // Sync Language settings
  useEffect(() => {
    localStorage.setItem("store_lang", language);
  }, [language]);

  // Sync Dark/Light body colors
  useEffect(() => {
    localStorage.setItem("store_dark_mode", String(isDarkMode));
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load backend stores data
  useEffect(() => {
    fetchStoreDocuments();
  }, []);

  const fetchStoreDocuments = async () => {
    setLoading(true);
    try {
      const activeSettings = await getStoreSettings();
      if (activeSettings) {
        setSettings(activeSettings);
      }
      const activeProducts = await getProducts();
      setProducts(activeProducts);
    } catch (e) {
      console.error("Critical: Could not retrieve database items", e);
    } finally {
      setLoading(false);
    }
  };

  // Listen to PWA installation invites
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const triggerPwaInstallation = async () => {
    if (!deferredPrompt) {
      // Manual advice fallback if not ready
      alert(
        isAr
          ? "لتثبيت التطبيق على جهازك:\n- آيفون: اضغط على زر 'مشاركه' وانقر 'إضافة إلى الشاشة الرئيسية'.\n- أندرويد/كروم: انقر على النقاط الثلاث بالأعلى واختر 'تثبيت التطبيق'."
          : "To install as a PWA:\n- Safari (iOS): Tap Share → 'Add to Home Screen'.\n- Chrome: Tap menu options → 'Install App'."
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User responded to PWA installation invites: ${outcome}`);
    setDeferredPrompt(null);
    setShowPwaInstallBtn(false);
  };

  // Translation helpers
  const t = {
    ar: {
      searchPlaceholder: "ابحث عن أدوات جري، دمبلز، كور كرة قدم...",
      all: "الكل",
      categories: "التصنيفات الرياضية",
      emptyProducts: "عذراً، لم نجد أدوات رياضية تطابق بحثك حالياً.",
      installPwa: "تثبيت التطبيق للجوال",
      installTip: "تصفح واشترِ أسرع بتنزيل التطبيق الآن",
      cartTitle: "حقيبة المشتريات",
      cartEmpty: "سلة التسوق فارغة تماماً، املأها بالأدوات الرياضية لتبدأ رحلة اللياقة!",
      total: "إجمالي السلة",
      checkoutBtn: "إتمام الشراء والدفع",
      directTitle: "استكمال تفاصيل الطلب وبوابة التوصيل",
      checkoutName: "الاسم الكامل للعميل",
      checkoutPhone: "رقم الهاتف النشط (للتواصل عبر واتساب)",
      placeNameHolder: "اكتب اسمك الثلاثي هنا...",
      placePhoneHolder: "مثال: 966500000000",
      checkoutAddress: "عنوان التوصيل المختار",
      placeAddressHolder: "سيتم ملء هذا تلقائياً عند النقر على الخريطة بالأسفل...",
      mapTitle: "حدد موقعك الجغرافي على الخريطة",
      submitOrder: "تأكيد وإرسال الطلب عبر واتساب ✅",
      closeBtn: "إغلاق",
      currency: "ج.م",
      directPrompt: "تفاصيل الطلب الفوري",
      orderSuccess: "تهانينا! تم تسجيل طلب الرياضي الخاص بك بنجاح 🎉",
      orderSuccessTip: "تم فتح نافذة إرسال الفاتورة عبر واتساب للأدمن لمباشرة تجهيز وتغليف طلبك فوراً.",
      rateBtn: "تقييم المتجر والأدوات",
      rateTitle: "شاركنا رأيك وتقييمك للمتجر الرياضي!",
      ratePlaceholder: "كود مراجعة أو رأيك الشخصي جودة أدواتنا الرياضية...",
      submitRating: "إرسال التقييم للعامة",
      latestRatings: "تقييمات وآراء أبطال وبطلات وصُنّاع اللياقة",
      ratingSuccess: "شكراً لك! تم إضافة مراجعتك إلى قائمة الشرف والتقييمات بنجاح.",
      heroTitle: "معداتك الرياضية الاحترافية للقمة 🥇",
      heroDesc: "تصفح تشكيلة واسعة من الكور الرياضية، أثقال الجيم المعتمدة، وساعات التتبع الذكية بتوصيل جغرافي دقيق وفواتير واتساب أوتوماتيكية."
    },
    en: {
      searchPlaceholder: "Search soccer balls, training weights, yoga mats...",
      all: "All",
      categories: "Sports Categories",
      emptyProducts: "Sorry, no training gears match your criteria today.",
      installPwa: "Install Smartphone App",
      installTip: "Browse offline and order faster by pinning us on home",
      cartTitle: "Your Shopping Bag",
      cartEmpty: "The bag is empty! Add premium sports equipment to kickstart your goals.",
      total: "Subtotal",
      checkoutBtn: "Proceed to Checkout",
      directTitle: "Checkout Information & Delivery Gateway",
      checkoutName: "Full Name",
      checkoutPhone: "Active WhatsApp Mobile Number",
      placeNameHolder: "Write your full name...",
      placePhoneHolder: "Example: 966500000000",
      checkoutAddress: "Neighborhood Address",
      placeAddressHolder: "This will fill automatically when choosing locations on the map...",
      mapTitle: "Pinpoint your Delivery Location on the Map",
      submitOrder: "Confirm & Send Order on WhatsApp ✅",
      closeBtn: "Dismiss",
      currency: "EGP",
      directPrompt: "Direct Quick Purchase Details",
      orderSuccess: "Superb! Your sports order has been locked successfully 🎉",
      orderSuccessTip: "Your WhatsApp receipt launcher is now open to trigger custom delivery dispatcher processes immediately.",
      rateBtn: "Rate Our Equipment Mat",
      rateTitle: "Rate your premium Sports Arena experience!",
      ratePlaceholder: "What is your opinion about our workout tools...",
      submitRating: "Submit Public Testimonial",
      latestRatings: "Community Champions Voice & Testimonials",
      ratingSuccess: "Gratitude! Your feedback has been deployed to the community boards.",
      heroTitle: "Unleash Your Ultimate Athletic Form 🥇",
      heroDesc: "Browse professional world-class sportswear, solid workout dumbbells, and smart smartwatches with live coordinate routing and automatic invoices."
    }
  }[language];

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Open cart drawer for delightful UI response
    setShowCart(true);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, val: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + val;
            return nextQty > 0 ? { ...item, quantity: nextQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Direct checkout trigger
  const handleDirectBuy = (product: Product) => {
    // Overwrite cart with single item for instant buy layout
    setCart([{ product, quantity: 1 }]);
    setShowCheckout(true);
  };

  // Handle coordinates from map picker
  const handleLocationSelectedOnMap = (lat: number, lng: number, addressString: string) => {
    setCheckoutForm((prev) => ({
      ...prev,
      address: addressString,
      coords: { lat, lng }
    }));
  };

  // Process checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Validation
    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
      alert(isAr ? "يرجى تعبئة كافة الحقول وتحديد الموقع" : "Please fill in all details and pinpoint address");
      return;
    }

    const nextId = "ord-" + Math.floor(100000 + Math.random() * 900000);
    const totalPrice = cart.reduce((acc, c) => acc + c.product.price * c.quantity, 0);

    const orderPayload: Order = {
      id: nextId,
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerAddress: checkoutForm.address,
      customerCoords: checkoutForm.coords,
      items: cart.map((c) => ({
        productId: c.product.id,
        productNameAr: c.product.nameAr,
        productNameEn: c.product.nameEn,
        price: c.product.price,
        quantity: c.quantity
      })),
      totalPrice,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    try {
      // Save order to databases
      await addOrder(orderPayload);
      
      // Auto trigger WhatsApp Invoice
      sendImmediateWhatsAppAlert(orderPayload);

      // Open Success trigger
      setRecentOrderId(nextId);
      setShowCheckout(false);
      setShowCart(false);
      setShowSuccessModal(true);

      // Reset Form fields
      setCheckoutForm({
        name: "",
        phone: "",
        address: "",
        coords: null
      });
      setCart([]);
    } catch (error) {
      console.error(error);
    }
  };

  // Auto alert formatting WhatsApp msg
  const sendImmediateWhatsAppAlert = (order: Order) => {
    const adminPhone = settings.adminWhatsapp ? settings.adminWhatsapp.replace(/[\s\-\+]/g, "") : "201012345678";
    
    let text = `*🆕 ${isAr ? "طلب شراء خارجي جديد" : "New Gym Store Customer Order"} #${order.id}*\n`;
    text += `=========================\n`;
    text += `👤 *${isAr ? "العميل" : "Buyer"}:* ${order.customerName}\n`;
    text += `📞 *${isAr ? "رقم الهاتف" : "Phone"}:* ${order.customerPhone}\n`;
    text += `📍 *${isAr ? "عنوان التوصيل" : "Address"}:* ${order.customerAddress}\n`;
    
    if (order.customerCoords) {
      text += `🗺️ *${isAr ? "رابط موقع الخريطة GPS" : "GPS Pin"}:* https://www.google.com/maps?q=${order.customerCoords.lat},${order.customerCoords.lng}\n`;
    }
    
    text += `=========================\n`;
    text += `📋 *${isAr ? "المنتجات والأدوات" : "Gears Selected"}:*\n`;
    
    order.items.forEach(it => {
      const name = isAr ? it.productNameAr : it.productNameEn;
      text += `- ${name} (x${it.quantity}) - ${it.price} ${isAr ? "ج.م" : "EGP"}\n`;
    });
    
    text += `=========================\n`;
    text += `💰 *${isAr ? "المجموع الكلي المطلوب" : "Grand Total"}:* ${order.totalPrice} ${isAr ? "ج.م" : "EGP"}\n\n`;
    text += `⚡ _${isAr ? "يرجى من الإدارة إرسال الفاتورة والاتصال بالعميل للتسليم" : "Please finalize delivery dispatch and send receipt over to the buyer."}_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${adminPhone}&text=${encoded}`, "_blank");
  };

  // Submit survey rating testimonial
  const submitSurveyRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyRating.comment.trim()) return;

    const testimonial = {
      name: checkoutForm.name || (isAr ? "بطل مجهول" : "Inspirational Athlete"),
      score: newSurveyRating.score,
      comment: newSurveyRating.comment,
      date: new Date().toISOString().split("T")[0]
    };

    setRatings((prev) => {
      const updated = [testimonial, ...prev];
      localStorage.setItem("store_user_ratings", JSON.stringify(updated));
      return updated;
    });

    // Reset survey rating state
    setNewSurveyRating({ score: 5, comment: "" });
    setShowRatingModal(false);
    alert(t.ratingSuccess);
  };

  // Query Firestore collection to instantly trace real-time order status
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = orderSearchVal.trim().toLowerCase();
    if (!queryStr) {
      setTrackingError(isAr ? "يرجى كتابة رقم الهاتف أو كود الطلب أولاً." : "Please input your phone number or Order ID.");
      return;
    }

    setIsTrackingLoading(true);
    setTrackingError("");
    setTrackedOrder(null);

    try {
      const allOrders = await getOrders();
      // Search matching by ID or by phone number
      const matched = allOrders.find((o: Order) => {
        const idMatch = o.id.toLowerCase() === queryStr || 
                        o.id.toLowerCase().replace("ord-", "") === queryStr || 
                        queryStr.includes(o.id.toLowerCase());
        const phoneClean = o.customerPhone.replace(/[\s\-\+]/g, "");
        const queryClean = queryStr.replace(/[\s\-\+]/g, "");
        const phoneMatch = phoneClean.length > 3 && queryClean.length > 3 && (phoneClean.includes(queryClean) || queryClean.includes(phoneClean));
        return idMatch || phoneMatch;
      });

      if (matched) {
        setTrackedOrder(matched);
      } else {
        setTrackingError(
          isAr 
            ? "لم نجد أي طلب مسجل بهذا الرقم أو الكود. تأكد من إتمام الطلب أولاً عبر واتساب." 
            : "No active order was found matching this phone number or ID. Please double check."
        );
      }
    } catch (err) {
      console.error(err);
      setTrackingError(isAr ? "حدث خطأ أثناء الاتصال بالخادم." : "An error occurred while linking to the tracking servers.");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Products category set builder
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.categoryEn.toLowerCase())))];

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesCat = activeCategory === "all" || p.categoryEn.toLowerCase() === activeCategory;
    
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      p.nameAr.toLowerCase().includes(term) ||
      p.nameEn.toLowerCase().includes(term) ||
      p.descriptionAr.toLowerCase().includes(term) ||
      p.descriptionEn.toLowerCase().includes(term) ||
      p.categoryAr.toLowerCase().includes(term) ||
      p.categoryEn.toLowerCase().includes(term);

    return matchesCat && matchesSearch;
  });

  const cartTotalSum = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div key={language} className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 ${directionClass} selection:bg-emerald-500 selection:text-white`}>
      
      {/* Dynamic Background Layout */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 via-transparent to-transparent pointer-events-none z-0 dark:block hidden" />

      {/* Main Specialized Navbar */}
      <Header
        settings={settings}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setShowCart(true)}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      {/* PWA Phone Callout Banner */}
      {showPwaInstallBtn && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-950 dark:to-teal-950 text-white p-3 shadow-md">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-yellow-300 animate-bounce" />
              <div>
                <p className="text-xs sm:text-sm font-extrabold">{t.installPwa}</p>
                <p className="text-[10px] sm:text-xs text-white/85">{t.installTip}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={triggerPwaInstallation}
                className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black text-xs rounded-lg cursor-pointer transition-colors shadow"
              >
                {isAr ? "تثبيت الآن 📱" : "Install 📱"}
              </button>
              <button
                onClick={() => setShowPwaInstallBtn(false)}
                className="text-white/70 hover:text-white text-xs px-2"
              >
                {isAr ? "تخطي" : "Skip"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        
        {/* Dynamic Sports Hero Frame */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 text-white shadow-2xl border border-zinc-800 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          
          <div className="absolute inset-x-0 bottom-0 top-[60%] bg-gradient-to-t from-emerald-950/20 to-transparent pointer-events-none" />
          
          {/* Hero details */}
          <div className="relative z-10 flex-1 space-y-5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-xs font-black text-emerald-400 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? "التميز في اللياقة والقوة البدنية" : "World-Class Sports Gears"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase">
              {t.heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed font-medium">
              {t.heroDesc}
            </p>

            {/* Quick action bullets */}
            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                {isAr ? "منتجات أصلية 100%" : "Original Brands"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {isAr ? "توصيل دقيق بالخريطة" : "GPS Map Delivery"}
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isAr ? "فواتير واتساب لحظية" : "Instant Invoices"}
              </span>
            </div>
          </div>

          {/* Hero illustrative widget */}
          <div className="flex-1 relative w-full max-w-sm aspect-square bg-gradient-to-br from-emerald-500/10 to-zinc-800/10 rounded-2xl border border-zinc-800/80 p-6 flex flex-col justify-between overflow-hidden shadow-inner shrink-0 leading-normal">
            <div className="flex items-center justify-between mb-4">
              <Dumbbell className="w-8 h-8 text-emerald-500 animate-spin-slow" />
              <span className="font-mono text-[10px] text-zinc-500 tracking-widest">{settings.storeNameEn}</span>
            </div>
            
            <div className="space-y-2">
              <div className="h-2 bg-zinc-800 rounded w-1/3" />
              <div className="h-5 bg-zinc-800 rounded w-4/5" />
              <div className="h-3 bg-zinc-800/60 rounded w-2/3" />
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400">{isAr ? "التوصيل المبتكر" : "Modern Logistics"}</span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] rounded">GPS STATIONS</span>
            </div>
          </div>

        </section>

        {/* ======================================================= */}
        {/* ATHLETICS CORE: REALTIME TRACKER & PRO INSTALLER GUIDE */}
        {/* ======================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          
          {/* CARD 1: LIVE ORDER STEPPER TRACKER */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                    {isAr ? "تتبع شحن وطلب مستلزمات اللياقة 🚚" : "Track Workout Gears Delivery 🚚"}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                    {isAr ? "أدخل رقم تليفونك أو كود الفاتورة للتحقق من حالة تسليم الأثقال والأجهزة" : "Track dumbbells, sportswear shipping details, and GPS locations."}
                  </p>
                </div>
              </div>

              {/* Mobile phone search inputs */}
              <form onSubmit={handleTrackOrder} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={orderSearchVal}
                  onChange={(e) => setOrderSearchVal(e.target.value)}
                  placeholder={isAr ? "رقم الهاتف النشط للطلب أو كود الطلب (ord-xxxx)..." : "Active phone number or order ID (e.g. ord-1011)..."}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isTrackingLoading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isTrackingLoading ? (isAr ? "بحث..." : "Trace...") : (isAr ? "تتبع الآن" : "Track Info")}
                </button>
              </form>

              {/* Warning/Error flags */}
              {trackingError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{trackingError}</span>
                </div>
              )}

              {/* Stepper visual diagram */}
              {trackedOrder ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/65 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl space-y-4 animate-fade-in text-left">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <span className="font-extrabold text-zinc-400">
                      {isAr ? "كود الطلبية:" : "Order ID:"} <span className="font-mono text-emerald-600">#{trackedOrder.id}</span>
                    </span>
                    <span className="font-bold text-zinc-500">
                      {new Date(trackedOrder.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                    </span>
                  </div>

                  {/* Stepper logic */}
                  <div className="relative pt-4 pb-2">
                    <div className="absolute left-4 right-4 top-8 h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
                    
                    <div 
                      className="absolute left-4 top-8 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-700" 
                      style={{ 
                        right: isAr ? 'auto' : 'none',
                        width: trackedOrder.status === 'pending' ? '15%' : 
                               trackedOrder.status === 'packing' ? '50%' : 
                               trackedOrder.status === 'delivering' ? '80%' : '100%' 
                      }} 
                    />

                    <div className="relative z-10 flex justify-between items-center text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          ['pending', 'packing', 'delivering', 'completed'].includes(trackedOrder.status)
                            ? "bg-emerald-500 text-white shadow-md"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        }`}>
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black">{isAr ? "الطلب مسجل" : "Registered"}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          ['packing', 'delivering', 'completed'].includes(trackedOrder.status)
                            ? "bg-emerald-500 text-white shadow-md"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        }`}>
                          <PackageCheck className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black">{isAr ? "التجهيز والتغليف" : "Packing"}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          ['delivering', 'completed'].includes(trackedOrder.status)
                            ? "bg-emerald-500 text-white shadow-md animate-pulse"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black">{isAr ? "مع المندوب" : "In Transit"}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          trackedOrder.status === 'completed'
                            ? "bg-emerald-500 text-white shadow-md"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        }`}>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black">{isAr ? "تم التسليم" : "Completed"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary notes */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850/60 p-3.5 rounded-xl text-xs space-y-2 leading-relaxed">
                    <div className="font-extrabold text-zinc-800 dark:text-zinc-250">
                      {isAr ? "العميل المستلم:" : "Receiver:"}{" "}
                      <span className="text-zinc-500 font-bold">{trackedOrder.customerName}</span>
                    </div>
                    <div className="text-zinc-400 font-bold">
                      {isAr ? "العنوان:" : "Address:"}{" "}
                      <span className="text-zinc-500 font-medium">{trackedOrder.customerAddress}</span>
                    </div>
                    <div className="text-zinc-400 font-medium">
                      {isAr ? "الأدوات المطلوبة:" : "Gym Equipment:"}{" "}
                      <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">
                        {trackedOrder.items.map((it) => `${isAr ? it.productNameAr : it.productNameEn} (x${it.quantity})`).join(", ")}
                      </span>
                    </div>
                    {trackedOrder.customerCoords && (
                      <a
                        href={`https://www.google.com/maps?q=${trackedOrder.customerCoords.lat},${trackedOrder.customerCoords.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400 hover:underline mt-1 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 animate-bounce" />
                        <span>{isAr ? "رابط تتبع الجي بي إس والتوصيل 🗺️" : "Follow on Google Maps GPS Routing 🗺️"}</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center border border-zinc-150 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 text-center p-4">
                  <PackageCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold leading-normal">
                    {isAr ? "لم يتم الاستعلام عن أي طلب في الوقت الحالي." : "No tracked orders loaded."}
                  </p>
                  <p className="text-[9px] text-zinc-400 mt-1 max-w-xs">
                    {isAr ? "اكتب رقم الموبايل أو كود الطلب واضغط بحث لتتبع شحن كابتن الفتنس فوراً." : "Supply order digits to trace active delivery logs."}
                  </p>
                </div>
              )}
            </div>

            <div className="text-[9px] text-zinc-400 font-mono mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
              <span>Database query status: Live Connected</span>
              <span>COD tracking dispatchers active</span>
            </div>
          </div>

          {/* CARD 2: PWA ADROID SMART WEBPAPK INSTALL EXPLAINER */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                    {isAr ? "تنزيل وتثبيت تطبيق فتنس برو للموبايل 📱" : "Install official App on your Mobile Screen 📱"}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                    {isAr ? "تبيتها بصيغة تطبيق حقيقي (WebAPK) لتنبيهات واتساب سريعة والعمل بدون إنترنت" : "Install with separate icons, notification logs, and smooth native views."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-2xl space-y-2 text-left">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>{isAr ? "ميزات التطبيق المستقل للفون:" : "Core App advantages for smartphones:"}</span>
                  </div>
                  <ul className="text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-350 space-y-1.5 list-disc list-inside leading-relaxed font-bold">
                    <li>{isAr ? "شاشة ملء كاملة بدون اشرطة المتصفح المزعجة لتبسيط التسوق" : "Full widescreen layout with optimized mobile headers"}</li>
                    <li>{isAr ? "الطلب الفوري وتتبع فوري للطلبية من شاشة الموبايل مباشرة" : "Instant checkout routines and automatic GPS locator retrieval"}</li>
                    <li>{isAr ? "كفاءة فائقة وسرعة تحميل ممتازة واستهلاك بيانات قليل جداً" : "Ultra low bandwidth consumption and persistent offline cart status"}</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => setShowPwaGuide(true)}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{isAr ? "افتح دليل التثبيت والمساعدة الذكية ⚙️" : "Unlock App Install Guide ⚙️"}</span>
                  </button>
                  <button
                    onClick={triggerPwaInstallation}
                    className="px-4 py-3 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-black text-xs rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? "تثبيت تلقائي بنقرة ⚡" : "Quick Install ⚡"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-zinc-400 font-mono mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
              <span>Installation State: W3C Standard</span>
              <span>Compatible with Chrome/Samsung Internet/Safari</span>
            </div>
          </div>

        </section>

        {/* Categories filters & search banner */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors duration-300">
          
          {/* Categories Horizontal scrolling container */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <div className="bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl flex gap-1 items-center shrink-0">
              {categories.map((catAny) => {
                const cat = catAny as string;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      isActive
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {cat === "all" ? t.all : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Inputs */}
          <div className="relative w-full md:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full text-xs pl-8 pr-3.5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
            />
            <Search className="absolute left-2.5 top-3.5 w-4 h-4 text-zinc-400" />
          </div>

        </section>

        {/* Database Products grid container */}
        <section>
          {loading ? (
            <div className="text-center py-20 space-y-3">
              <Dumbbell className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-zinc-400">Loading catalog items...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-xl mx-auto space-y-6 shadow-sm transition-colors duration-300">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  {isAr ? "المتجر الرياضي فارغ وجاهز لعرض أدواتك! 🏆" : "The Sports Arena is empty and ready for your gears! 🏆"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {isAr
                    ? "لقد قمنا بتفريغ كافة المنتجات التجريبية بناءً على طلبك. يمكنك الآن البدء فوراً في إضافة الكور، الأثقال، وباقي مستلزمات التمرين الرياضية من لوحة التحكم."
                    : "We have cleared all pre-loaded mock sports gear. You can now start adding balls, weights, and athletic gear immediately from the Admin Panel."}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowAdmin(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>{isAr ? "افتح لوحة تحكم الأدمن من هنا ⚙️" : "Open Admin Control Panel Here ⚙️"}</span>
                </button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
              <Filter className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <p className="text-base font-bold text-zinc-600 dark:text-zinc-400">
                {t.emptyProducts}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart}
                  onDirectBuy={handleDirectBuy}
                  language={language}
                />
              ))}
            </div>
          )}
        </section>

        {/* Testimonials Review Feed section */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>{t.latestRatings}</span>
            </h3>
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100/50"
            >
              {isAr ? "أضف تقييمك الخاص" : "Write Review"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ratings.map((rate, rIdx) => (
              <div 
                key={rIdx} 
                className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{rate.name}</span>
                    <span className="text-[10px] text-zinc-400">{rate.date}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed italic mb-4">
                    "{rate.comment}"
                  </p>
                </div>
                
                {/* Yellow stars scores */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, sIdx) => (
                    <Star 
                      key={sIdx} 
                      className={`w-3.5 h-3.5 ${sIdx < rate.score ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-800"}`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Cart drawer overlay panel */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 h-full flex flex-col justify-between shadow-2xl p-6 border-l border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                    {t.cartTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 px-4 space-y-4">
                  <ShoppingBag className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    {t.cartEmpty}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex gap-3 text-left"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.nameEn}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {isAr ? item.product.nameAr : item.product.nameEn}
                        </div>
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {item.product.price} {t.currency}
                        </div>

                        {/* Adjust quantities */}
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold px-2">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-600 p-1"
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

            {/* Subtotal and checkout trigger */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between text-sm font-black text-zinc-700 dark:text-zinc-300">
                  <span>{t.total}</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {cartTotalSum} {t.currency}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
                >
                  {t.checkoutBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Screen Panel Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-zinc-50 dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800/80 flex flex-col md:flex-row h-[90vh] md:h-[80vh] transition-colors duration-300">
            
            {/* Form details input on left */}
            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto text-left flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/85 mb-6">
                  <h3 className="font-extrabold text-base text-zinc-950 dark:text-white">
                    {t.directTitle}
                  </h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">
                      {t.checkoutName}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.placeNameHolder}
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">
                      {t.checkoutPhone}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.placePhoneHolder}
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">
                      {t.checkoutAddress}
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder={t.placeAddressHolder}
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Summary lists of items purchased */}
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl space-y-1">
                    <div className="text-[10px] font-black text-zinc-400 tracking-wider">
                      {isAr ? "حقيبة الأدوات الرياضية" : "Selected workouts"}
                    </div>
                    {cart.map((c) => (
                      <div key={c.product.id} className="text-xs flex justify-between font-bold text-zinc-700 dark:text-zinc-300">
                        <span>{isAr ? c.product.nameAr : c.product.nameEn} (x{c.quantity})</span>
                        <span>{c.product.price * c.quantity} {t.currency}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-black text-emerald-600 mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                      <span>{t.total}</span>
                      <span>{cartTotalSum} {t.currency}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
                  >
                    {t.submitOrder}
                  </button>
                </form>
              </div>

              <div className="text-[10px] text-zinc-400 text-center leading-normal pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {isAr 
                  ? "تأكيد الطلب سيقوم بتوجيه الفاتورة والبيانات بالكامل إلى واتساب الأدمن فورا."
                  : "Confirmation triggers automatic invoice notes directly with the managers."
                }
              </div>
            </div>

            {/* Map Picker on right */}
            <div className="w-full md:w-1/2 p-4 md:p-6 bg-zinc-100 dark:bg-zinc-900 flex flex-col">
              <div className="text-xs font-black text-zinc-500 mb-2 truncate uppercase tracking-widest">
                {t.mapTitle}
              </div>
              <div className="flex-1">
                <MapPicker
                  currentCoords={checkoutForm.coords}
                  onLocationSelect={handleLocationSelectedOnMap}
                  isDarkMode={isDarkMode}
                  language={language}
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUCCESS MODAL TRIGGER */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 rounded-3xl max-w-md w-full text-center space-y-4 relative shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-990/45 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce mb-2">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
              {t.orderSuccess}
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
              {t.orderSuccessTip}
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-850 text-xs font-bold text-emerald-600">
              {isAr ? "رقم الطلبية الحاصة بك" : "ORDER KEY"}: #{recentOrderId}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowRatingModal(true);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                {t.rateBtn}
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs rounded-xl"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING TESTIMONIAL SURVEY SUBMIT MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full text-center space-y-4 shadow-2xl">
            
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 fill-amber-500" />
            </div>

            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
              {t.rateTitle}
            </h3>

            <form onSubmit={submitSurveyRating} className="space-y-4">
              
              {/* Star choosing slider scale */}
              <div className="flex justify-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setNewSurveyRating({ ...newSurveyRating, score: sc })}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        sc <= newSurveyRating.score 
                          ? "fill-yellow-400 text-yellow-400 hover:scale-110 duration-200" 
                          : "text-zinc-300 dark:text-zinc-700 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={3}
                placeholder={t.ratePlaceholder}
                value={newSurveyRating.comment}
                onChange={(e) => setNewSurveyRating({ ...newSurveyRating, comment: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 py-2 bg-zinc-200 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
                >
                  {t.closeBtn}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs-rounded shadow cursor-pointer rounded-xl"
                >
                  {t.submitRating}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURE OVERLAY ADMIN INTEGRATION SWITCH */}
      {showAdmin && (
        <AdminPanel
          settings={settings}
          onClose={() => setShowAdmin(false)}
          language={language}
          isDarkMode={isDarkMode}
          onSettingsUpdate={(updatedSettings) => setSettings(updatedSettings)}
          onProductsUpdate={() => { fetchStoreDocuments(); }}
        />
      )}

      {/* PWA INTELLIGENT INSTALLATION GUIDELINE PORTAL */}
      {showPwaGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 md:p-8 rounded-3xl max-w-lg w-full space-y-5 relative shadow-2xl animate-fade-in text-left">
            
            <button
              onClick={() => setShowPwaGuide(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                  {isAr ? "دليل تثبيت التطبيق على الجوال 📱" : "Smartphone App Installation Guide 📱"}
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  {isAr ? "احصل على أيقونة فتنس برو على هاتفك بدون متجر تفانين!" : "Pin Fitness Pro on your phone without app store logins!"}
                </p>
              </div>
            </div>

            {/* Platform Options Tabs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-left">
              
              {/* Android Guide */}
              <div className="border border-zinc-150 dark:border-zinc-800/80 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white font-bold rounded-md">Android</span>
                  <span className="text-[11px] font-extrabold text-zinc-500">{isAr ? "لهواتف أندرويد وكروم" : "For Android & Chrome"}</span>
                </div>
                
                <div className="text-[11px] text-zinc-600 dark:text-zinc-350 space-y-2 leading-relaxed font-bold">
                  <p className="text-red-500 dark:text-red-400 leading-normal">
                    {isAr 
                      ? "⚠️ هام جداً: التثبيت كأبلكيشن حقيقي مدعوم عبر متصفح كروم أو سامسونج فقط." 
                      : "⚠️ Note: Installing requires the official Google Chrome / Samsung browser."
                    }
                  </p>
                  <ul className="space-y-1.5 list-decimal list-inside text-zinc-750 dark:text-zinc-300">
                    <li>{isAr ? "افتح الموقع في متصفح كروم الرسمي." : "Open in Google Chrome browser."}</li>
                    <li>{isAr ? "إذا كنت داخل فيسبوك/واتساب، اضغط على النقاط الـ3 واصنع (فتح في المتصفح الخارجي)." : "If inside chat/FB, tap 3-dots and select Open in External."}</li>
                    <li>{isAr ? "اضغط على زر (تثبيت تلقائي بنقرة ⚡) في لوحة المتابعة بالمتجر." : "Tap (Quick Install ⚡) from our Store dashboard."}</li>
                    <li>{isAr ? "أو اضغط خيارات كروم بالأعلى واختر (تثبيت التطبيق) لتركيبه كـ APK حقيقي ومستقل!" : "Or tap Chrome's 3-dots and click (Install App) for genuine integration!"}</li>
                  </ul>
                </div>
              </div>

              {/* iOS Safari Guide */}
              <div className="border border-zinc-150 dark:border-zinc-800/80 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-600 dark:bg-zinc-800 text-white font-bold rounded-md">Apple iOS</span>
                  <span className="text-[11px] font-extrabold text-zinc-500">{isAr ? "لهواتف آيفون وآيباد" : "For iPhones & iPads"}</span>
                </div>

                <div className="text-[11px] text-zinc-600 dark:text-zinc-350 space-y-2 leading-relaxed font-bold">
                  <p className="text-zinc-400">
                    {isAr 
                      ? "⚠️ تمنع آبل التثبيت المباشر خارج سفاري، لذا يرجى التحقق من الآتي:" 
                      : "⚠️ Apple restricts app installation on iOS to Safari browser only:"
                    }
                  </p>
                  <ul className="space-y-1.5 list-decimal list-inside text-zinc-750 dark:text-zinc-300">
                    <li>{isAr ? "تأكد من فتح الرابط باستخدام متصفح سفاري (Safari) الأصلي." : "Open the link using Safari browser."}</li>
                    <li>{isAr ? "اضغط على زر المشاركة سفاري (الشير) 📤 المتواجد بأسفل الشاشة." : "Tap the Share button 📤 in Safari's bottom bar."}</li>
                    <li>{isAr ? "اسحب قائمة الخيارات لأسفل واضغط على (إضافة إلى الشاشة الرئيسية) ➕." : "Scroll down and tap (Add to Home Screen)　➕."}</li>
                    <li>{isAr ? "اضغط على كلمة (إضافة) بالزاوية العلوية ليتم تنصيب التطبيق بنجاح بملء الشاشة!" : "Click (Add) at the top right corner to complete the mobile install!"}</li>
                  </ul>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setShowPwaGuide(false)}
                className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-black rounded-xl cursor-pointer transition active:scale-95 text-center"
              >
                {isAr ? "فهمت، إغلاق الدليل والمتابعة 🤝" : "Acknowledge & Close 🤝"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* General Humble footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white dark:bg-zinc-950 text-zinc-400 text-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-[10px]">
              <Dumbbell className="w-3 h-3" />
            </div>
            <span className="font-bold tracking-tight text-zinc-600 dark:text-zinc-350">
              {isAr ? settings.storeNameAr : settings.storeNameEn}
            </span>
          </div>

          <p className="text-center font-medium">
            {isAr 
              ? "© 2026 جميع الحقوق محفوظة لـ صانعي الرشاقة والقوة." 
              : "© 2026 All Rights Reserved to Fitness Creators."
            }
          </p>

          <p className="opacity-70">
            {isAr ? "توصيل دقيق • دفع آمن عند الاستلام • فواتير واتساب" : "Precise Routing • Secure COD • Live WhatsApp Invoicing"}
          </p>
        </div>
      </footer>

    </div>
  );
}
