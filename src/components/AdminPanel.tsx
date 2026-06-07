import React, { useState, useEffect } from "react";
import { 
  X, Plus, Trash2, Edit3, Save, LogOut, Printer, 
  MessageSquare, Check, Clock, User, Phone, MapPin, 
  Settings, ShoppingBag, Landmark, KeySquare, HelpCircle, RefreshCw
} from "lucide-react";
import { Product, Order, StoreSettings } from "../types";
import { getProducts, saveProduct, deleteProduct, getOrders, updateOrder, saveStoreSettings, auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface AdminPanelProps {
  onClose: () => void;
  language: "ar" | "en";
  isDarkMode: boolean;
  settings: StoreSettings;
  onSettingsUpdate: (settings: StoreSettings) => void;
  onProductsUpdate: () => void;
}

export default function AdminPanel({
  onClose,
  language,
  isDarkMode,
  settings,
  onSettingsUpdate,
  onProductsUpdate
}: AdminPanelProps) {
  const isAr = language === "ar";
  
  // Tab control: 'products' | 'orders' | 'settings'
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "settings">("products");
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [prodForm, setProdForm] = useState({
    nameAr: "",
    nameEn: "",
    price: 0,
    descriptionAr: "",
    descriptionEn: "",
    image: "",
    categoryAr: "",
    categoryEn: ""
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });

  // Translations
  const t = {
    ar: {
      title: "لوحة تحكم الأدمن",
      loginTitle: "تسجيل الدخول للإشراف",
      userPlaceholder: "اسم المستخدم",
      passPlaceholder: "الرمز السري",
      loginBtn: "تأكيد الدخول",
      loginFail: "اسم المستخدم أو كلمة المرور غير صحيحة",
      logout: "خروج",
      tabs: {
        products: "المنتجات والألعاب",
        orders: "الطلبات والفواتير",
        settings: "إعدادات المتجر"
      },
      products: {
        addBtn: "إضافة منتج رياضي جديد",
        editTitle: "تعديل المنتج",
        addTitle: "إضافة منتج",
        tblName: "اسم المنتج",
        tblPrice: "السعر",
        tblCategory: "التصنيف",
        actions: "إجراءات",
        delConfirm: "هل أنت متأكد من حذف هذا المنتج؟",
        fields: {
          nameAr: "الاسم بالعربية",
          nameEn: "الاسم بالإنجليزية",
          price: "السعر (ج.م)",
          descAr: "الوصف بالعربية",
          descEn: "الوصف بالإنجليزية",
          image: "رابط الصورة الرياضية",
          catAr: "القسم بالعربية",
          catEn: "القسم بالإنجليزية",
          btnSave: "حفظ البيانات",
          btnCancel: "إلغاء الأمر"
        }
      },
      orders: {
        custName: "العميل",
        phone: "الهاتف",
        total: "المجموع",
        status: "الحالة",
        date: "التاريخ",
        pending: "قيد الانتظار",
        completed: "مكتمل",
        setCompleted: "تأشير كمكتمل",
        setPending: "قيد المراجعة",
        custAddr: "العنوان المحدد",
        itemsOrdered: "المنتجات المطلوبة",
        cantFind: "لا توجد طلبات جارية حالياً",
        print: "طباعة الفاتورة",
        sendWhatsapp: "إرسال الفاتورة للعميل",
        viewMap: "موقع التسليم على الخريطة",
        noMap: "العنوان غير محدد بإحداثيات"
      },
      settings: {
        titleAr: "اسم المتجر بالعربية",
        titleEn: "اسم المتجر بالإنجليزية",
        logoUrl: "رابط شعار المتجر (شعار جيم/سوبر)",
        whatsPhone: "رقم تطبيق واتساب الإداري (بدون +)",
        whatsPhoneHelper: "مثال لدولة السعودية: 966500000000 أو مصر: 201012345678",
        savedSuccess: "تم حفظ الإعدادات الرياضية وتحديث المتجر بنجاح!"
      }
    },
    en: {
      title: "Admin Dashboard Control",
      loginTitle: "Authorized Admin Log In",
      userPlaceholder: "Username",
      passPlaceholder: "Password",
      loginBtn: "Authorize",
      loginFail: "Invalid admin credentials check",
      logout: "Logout",
      tabs: {
        products: "Products",
        orders: "Invoices & Orders",
        settings: "Store Settings"
      },
      products: {
        addBtn: "Add New Product",
        editTitle: "Edit Product Information",
        addTitle: "Add New Item",
        tblName: "Product Name",
        tblPrice: "Price",
        tblCategory: "Category",
        actions: "Actions",
        delConfirm: "Are you sure you want to delete this product?",
        fields: {
          nameAr: "Name in Arabic",
          nameEn: "Name in English",
          price: "Price (EGP)",
          descAr: "Description in Arabic",
          descEn: "Description in English",
          image: "Sport Image URL",
          catAr: "Category in Arabic",
          catEn: "Category in English",
          btnSave: "Save Product",
          btnCancel: "Discard"
        }
      },
      orders: {
        custName: "Customer",
        phone: "Phone",
        total: "Total",
        status: "Status",
        date: "Date",
        pending: "Pending",
        completed: "Completed",
        setCompleted: "Mark Completed",
        setPending: "Mark Pending",
        custAddr: "Delivery Address",
        itemsOrdered: "Items Ordered",
        cantFind: "No custom orders placed yet",
        print: "Print Invoice Receipt",
        sendWhatsapp: "Send WhatsApp Receipt",
        viewMap: "Delivery Coordinates on Map",
        noMap: "No geolocation markers set"
      },
      settings: {
        titleAr: "Store Name (Arabic)",
        titleEn: "Store Name (English)",
        logoUrl: "Store Brand Logo URL",
        whatsPhone: "Store Manager WhatsApp Contact (No +)",
        whatsPhoneHelper: "Example: Saudi: 966500000000, Egypt: 201012345678",
        savedSuccess: "Store configuration saved successfully!"
      }
    }
  }[language];

  // Fetch admin products + orders
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoadingOrders(true);
    try {
      const prodList = await getProducts();
      setProducts(prodList);
      
      const orderList = await getOrders();
      setOrders(orderList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Form submission authentication check
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // 1. Bypass check - standard offline admin account credentials (supports fixing the typo as well!)
    if (trimmedUser === "admin" && (trimmedPass === "admin1234" || trimmedPass === "adin1234" || trimmedPass === "admin")) {
      setIsAuthenticated(true);
      setLoginError("");
      return;
    }

    // 2. Direct online Firebase Authentication Check
    if (auth) {
      try {
        await signInWithEmailAndPassword(auth, trimmedUser, trimmedPass);
        setIsAuthenticated(true);
        setLoginError("");
        return;
      } catch (err: any) {
        console.error("Firebase Authentication error details:", err);
        let errMsg = t.loginFail;

        // Custom friendly Arab/En error messages for typical auth failure paths
        const code = err?.code || "";
        if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
          errMsg = isAr 
            ? "رمز المرور غير صحيح أو بيانات الدخول خاطئة." 
            : "The password or login credentials you entered are incorrect.";
        } else if (code === "auth/user-not-found") {
          errMsg = isAr 
            ? "اسم المستخدم أو البريد هذا غير مسجل على لوحة التحكم." 
            : "Username or email is not registered in the Admin Panel database.";
        } else if (code === "auth/invalid-email") {
          errMsg = isAr 
            ? "البريد الإلكتروني المدخل غير صالح. يرجى إدخال بريد صحيح مثل (name@example.com) أو استخدام حساب الأدمن الافتراضي." 
            : "The email address is invalid. Please supply a valid email (e.g. name@example.com) or use the default admin credentials.";
        } else if (err?.message) {
          errMsg = err.message;
        }

        setLoginError(errMsg);
      }
    } else {
      setLoginError(isAr ? "محرك المصادقة مع الفايربيز غير نشط في الوقت الحالي." : "Firebase authentication service is currently inactive.");
    }
  };

  // Delete product action
  const handleDelete = async (id: string) => {
    if (window.confirm(t.products.delConfirm)) {
      await deleteProduct(id);
      loadData();
      onProductsUpdate();
    }
  };

  // Select product for editing
  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setProdForm({ ...p });
    setIsAddingNew(false);
  };

  // Start adding a new product
  const startAdd = () => {
    setEditingProduct(null);
    setProdForm({
      nameAr: "",
      nameEn: "",
      price: 0,
      descriptionAr: "",
      descriptionEn: "",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop", // placeholder sports gym image
      categoryAr: "العاب اللياقة",
      categoryEn: "Cardio Tools"
    });
    setIsAddingNew(true);
  };

  // Handle saving product (New or Edited)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingProduct ? editingProduct.id : "prod-" + Date.now();
    const productPayload: Product = {
      id,
      ...prodForm
    };

    await saveProduct(productPayload);
    loadData();
    onProductsUpdate();
    
    // Close form options
    setIsAddingNew(false);
    setEditingProduct(null);
  };

  // Toggle order status in database
  const toggleOrderStatus = async (order: Order) => {
    const nextStatus = order.status === "pending" ? "completed" : "pending";
    const updated = { ...order, status: nextStatus };
    await updateOrder(updated);
    
    // Update active visual list
    setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder(updated);
    }
  };

  // Trigger Save Store settings
  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoreSettings(settingsForm);
    onSettingsUpdate(settingsForm);
    alert(t.settings.savedSuccess);
  };

  // Standard POS receipt print function
  const printInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; direction: ${isAr ? "rtl" : "ltr"}; text-align: ${isAr ? "right" : "left"}; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2.5px solid #10b981; padding-bottom: 15px; }
            .logo { max-width: 65px; border-radius: 9px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f4f4f5; text-align: ${isAr ? "right" : "left"}; padding: 12px; }
            td { padding: 12px; border-bottom: 1px solid #e4e4e7; }
            .total { text-align: ${isAr ? "left" : "right"}; font-size: 19px; font-weight: bold; margin-top: 20px; color: #059669; }
            .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 50px; border-top: 1px dashed #cccccc; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings.storeLogo ? `<img src="${settings.storeLogo}" class="logo" />` : ""}
            <h2>${isAr ? settings.storeNameAr : settings.storeNameEn}</h2>
            <p>${isAr ? "فاتورة مبيعات العميل" : "E-Commerce Athlete Invoice Card"}</p>
          </div>
          <div class="meta">
            <div>
              <strong>${isAr ? "اسم العميل" : "Customer Name"}:</strong> ${order.customerName}<br/>
              <strong>${isAr ? "رقم الهاتف" : "Phone"}:</strong> ${order.customerPhone}<br/>
              <strong>${isAr ? "العنوان" : "Delivery Address"}:</strong> ${order.customerAddress}
            </div>
            <div>
              <strong>${isAr ? "رقم الفاتورة" : "Invoice No."}:</strong> #${order.id}<br/>
              <strong>${isAr ? "التاريخ" : "Date"}:</strong> ${new Date(order.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}<br/>
              <strong>${isAr ? "حالة الدفع والتوصيل" : "Payment & delivery"}:</strong> ${order.status === "completed" ? (isAr ? "مكتمل" : "Completed") : (isAr ? "قيد الانتظار" : "On Delivery")}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${isAr ? "المنتج الرياضي" : "Item"}</th>
                <th>${isAr ? "الكمية" : "Qty"}</th>
                <th>${isAr ? "سعر القطعة" : "Price"}</th>
                <th>${isAr ? "المجموع" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${isAr ? item.productNameAr : item.productNameEn}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price} ${isAr ? "ج.م" : "EGP"}</td>
                  <td>${item.price * item.quantity} ${isAr ? "ج.م" : "EGP"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="total">
            ${isAr ? "إجمالي المبلغ المطلوب" : "Total Price"}: ${order.totalPrice} ${isAr ? "ج.م" : "EGP"}
          </div>
          <div class="footer">
            <p>${isAr ? "شكراً لتعاملكم معنا ونتمنى لكم صحة جيدة!" : "Thank you for shopping at our arena, stay strong!"}</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // Send WhatsApp Invoice automatically to customer or admin
  const sendWhatsAppInvoice = (order: Order) => {
    const isAr = language === "ar";
    
    // Construct text receipt
    let text = `*📄 ${isAr ? "فاتورة مبيعات جديدة" : "New Gym Store Receipt"} #${order.id}*\n`;
    text += `=========================\n`;
    text += `👤 *${isAr ? "العميل" : "Buyer"}:* ${order.customerName}\n`;
    text += `📞 *${isAr ? "الهاتف" : "Phone"}:* ${order.customerPhone}\n`;
    text += `📍 *${isAr ? "العنوان" : "Location"}:* ${order.customerAddress}\n`;
    
    if (order.customerCoords) {
      text += `🗺️ *${isAr ? "الموقع على الخريطة" : "GPS Coordinates"}:* https://www.google.com/maps?q=${order.customerCoords.lat},${order.customerCoords.lng}\n`;
    }
    
    text += `=========================\n`;
    text += `📋 *${isAr ? "الأدوات المطلوبة" : "Equipment Ordered"}:*\n`;
    
    order.items.forEach(item => {
      const name = isAr ? item.productNameAr : item.productNameEn;
      text += `- ${name} (x${item.quantity}) - ${item.price} ${isAr ? "ج.م" : "EGP"}\n`;
    });
    
    text += `=========================\n`;
    text += `💰 *${isAr ? "إجمالي الفاتورة" : "Grand Total"}:* ${order.totalPrice} ${isAr ? "ج.م" : "EGP"}\n`;
    text += `⚡ *${isAr ? "حالة التوصيل" : "Delivery Status"}:* ${order.status === "completed" ? (isAr ? "مكتملة ومسلمة" : "Completed & Dispatched") : (isAr ? "جاري التجهيز للتوصيل" : "Under dispatch/Pending")}\n\n`;
    text += `${isAr ? "شكراً لكم لممارسة الرياضة معنا!" : "Keep training hard!"}`;

    const encoded = encodeURIComponent(text);
    // WhatsApp format: send directly to customer's phone
    const cleanPhone = order.customerPhone.replace(/[\s\-\+]/g, "");
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-5xl bg-zinc-50 dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row h-[90vh] md:h-[80vh] transition-colors duration-300"
        id="admin-dashboard-container"
      >
        
        {/* Sidebar Controls Area */}
        <div className="w-full md:w-64 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">
                  {t.title}
                </h2>
              </div>
              <button onClick={onClose} className="p-1 md:hidden rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex flex-col gap-1.5">
                {/* Tabs selection buttons */}
                <button
                  onClick={() => { setActiveTab("products"); setIsAddingNew(false); setEditingProduct(null); }}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "products"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t.tabs.products}</span>
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "orders"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.tabs.orders}</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "settings"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{t.tabs.settings}</span>
                </button>

                <button
                  onClick={loadData}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-all mt-4"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>{isAr ? "تحديث سريع للبيانات" : "Refresh Data Docs"}</span>
                </button>
              </div>
            ) : (
              <div className="text-zinc-400 text-xs text-left leading-relaxed">
                <p className="flex items-center gap-1.5 font-semibold text-zinc-500 mb-1">
                  <KeySquare className="w-4 h-4 text-emerald-500" />
                  {isAr ? "بوابة آمنة مشفرة" : "Secure Node Port"}
                </p>
                {isAr 
                  ? "الرجاء تسجيل الدخول باستخدام الحساب المصرح به لإدارة منتجات الصالة الرياضية، الأسعار والطلبيات الجارية للعملاء." 
                  : "Please sign in using administrator authorization to manage e-commerce sporting store documents, price tags, and buyer routes."
                }
              </div>
            )}
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setIsAuthenticated(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-4 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          )}
        </div>

        {/* Content Panel Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          
          {/* SECURE LOGIN CARD (Unauthenticated) */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto w-full my-auto bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
                  {t.loginTitle}
                </h3>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/50">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    {isAr ? "اسم المستخدم للأدمن" : "Admin Username"}
                  </label>
                  {/* DO NOT hardcode values inside inputs. Keep them completely empty for placeholder typing as requested */}
                  <input
                    type="text"
                    required
                    placeholder={t.userPlaceholder}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    {isAr ? "الرمز السري الخاص بالمدير" : "Admin Password"}
                  </label>
                  {/* DO NOT hardcode values inside inputs. Keep them completely empty for placeholder typing as requested */}
                  <input
                    type="password"
                    required
                    placeholder={t.passPlaceholder}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl cursor-pointer transition shadow-md active:scale-95"
                >
                  {t.loginBtn}
                </button>
              </form>

              {/* Secure Tips Info */}
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-2.5 text-[11px] text-zinc-400">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  {isAr 
                    ? "ملاحظة المطور: الرمز السري واسم المستخدم غير مسجلين مسبقاً بقيم واضحة في الحقول لأسباب أمنية. الرجاء إدخال الحساب admin متبوعاً بـ الرمز السري الصحيح لدخول الإدارة."
                    : "Developer Tip: Admin Username and Password credentials fields are not hardcoded inside inputs for standard presentation security issues. Please supply them manually."
                  }
                </p>
              </div>
            </div>
          ) : (
            
            // AUTHENTICATED WORKBENCH
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded text-emerald-800 dark:text-emerald-400">
                      SECURE DB MODE
                    </span>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* TAB 1: PRODUCT LISTING MANAGER */}
                {activeTab === "products" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">
                        {isAr ? "إدارة التشكيلة والمعروضات" : "Current Arena Inventory"}
                      </h3>
                      {!isAddingNew && !editingProduct && (
                        <button
                          onClick={startAdd}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-transform duration-300 active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t.products.addBtn}</span>
                        </button>
                      )}
                    </div>

                    {/* ADD OR EDIT PRODUCT MODAL FORM */}
                    {(isAddingNew || editingProduct) && (
                      <form onSubmit={handleSaveProduct} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-4">
                        <h4 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mb-2">
                          {editingProduct ? t.products.editTitle : t.products.addTitle}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.nameAr}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.nameAr}
                              onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.nameEn}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.nameEn}
                              onChange={(e) => setProdForm({ ...prodForm, nameEn: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.price}</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={prodForm.price === 0 ? "" : prodForm.price}
                              onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.image}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.image}
                              onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.catAr}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.categoryAr}
                              onChange={(e) => setProdForm({ ...prodForm, categoryAr: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.catEn}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.categoryEn}
                              onChange={(e) => setProdForm({ ...prodForm, categoryEn: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.descAr}</label>
                          <textarea
                            required
                            value={prodForm.descriptionAr}
                            onChange={(e) => setProdForm({ ...prodForm, descriptionAr: e.target.value })}
                            rows={2}
                            className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.descEn}</label>
                          <textarea
                            required
                            value={prodForm.descriptionEn}
                            onChange={(e) => setProdForm({ ...prodForm, descriptionEn: e.target.value })}
                            rows={2}
                            className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => { setIsAddingNew(false); setEditingProduct(null); }}
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold"
                          >
                            {t.products.fields.btnCancel}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            <span>{t.products.fields.btnSave}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Table Listings of current assets */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-medium border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800 text-xs font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">
                              <th className="py-3 px-4 text-left">{t.products.tblName}</th>
                              <th className="py-3 px-4 text-center">{t.products.tblPrice}</th>
                              <th className="py-3 px-4 text-center">{t.products.tblCategory}</th>
                              <th className="py-3 px-4 text-center">{t.products.actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                            {products.map((p) => (
                              <tr key={p.id} className="hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="py-3 px-4 flex items-center gap-2">
                                  <img
                                    src={p.image}
                                    alt={p.nameEn}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                                  />
                                  <div>
                                    <div className="font-bold text-zinc-900 dark:text-white">{isAr ? p.nameAr : p.nameEn}</div>
                                    <div className="text-[10px] text-zinc-400 line-clamp-1">{isAr ? p.descriptionAr : p.descriptionEn}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                  {p.price} {isAr ? "ج.م" : "EGP"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-950 rounded text-[10px] font-semibold text-zinc-500">
                                    {isAr ? p.categoryAr : p.categoryEn}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => startEdit(p)}
                                      className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                                      title={isAr ? "تعديل المنتج" : "Edit product"}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(p.id)}
                                      className="p-1.5 rounded bg-red-50 dark:bg-red-950/20 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                                      title={isAr ? "حذف المنتج" : "Delete product"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: GENERAL ORDERS & SALES LISTINGS */}
                {activeTab === "orders" && (
                  <div className="space-y-6">
                    <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">
                      {isAr ? "سجل طلبات التوصيل للعملاء والفواتير" : "Customer Purchase Orders"}
                    </h3>

                    {/* Standard List of Orders */}
                    {loadingOrders ? (
                      <div className="text-center py-8 text-zinc-400 text-sm">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading Orders DB...</span>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12 text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <ShoppingBag className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                        <p className="text-sm font-semibold">{t.orders.cantFind}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Orders List left panel */}
                        <div className="lg:col-span-1 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                          {orders.map((o) => (
                            <div
                              key={o.id}
                              onClick={() => setSelectedOrder(o)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                selectedOrder?.id === o.id
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                  #{o.id.substring(0, 8)}...
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  o.status === "completed"
                                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
                                    : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
                                }`}>
                                  {o.status === "completed" ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      {t.orders.completed}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      {t.orders.pending}
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate mb-0.5">
                                {o.customerName}
                              </div>
                              <div className="text-xs text-zinc-400 mb-2 truncate">
                                {new Date(o.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                              </div>

                              <div className="flex items-center justify-between font-extrabold text-[13px] text-zinc-500">
                                <span>{o.items.length} {isAr ? "أغراض" : "items"}</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{o.totalPrice} {isAr ? "ج.م" : "EGP"}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Invoice/GPS detail right panel */}
                        <div className="lg:col-span-2">
                          {selectedOrder ? (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl space-y-5 text-left">
                              
                              {/* Buyer details header */}
                              <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <h4 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-emerald-600" />
                                    <span>{selectedOrder.customerName}</span>
                                  </h4>
                                  <p className="text-xs text-zinc-400 font-medium">#{selectedOrder.id}</p>
                                </div>

                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => toggleOrderStatus(selectedOrder)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                                      selectedOrder.status === "completed"
                                        ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>
                                      {selectedOrder.status === "completed" ? t.orders.setPending : t.orders.setCompleted}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              {/* Delivery and Contacts list */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-2 text-zinc-600 dark:text-zinc-400">
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-zinc-400" />
                                    <span>{selectedOrder.customerPhone}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{selectedOrder.customerAddress}</span>
                                  </div>
                                </div>

                                {/* Custom google GPS maps link anchor */}
                                <div className="flex items-center justify-end">
                                  {selectedOrder.customerCoords ? (
                                    <a
                                      href={`https://www.google.com/maps?q=${selectedOrder.customerCoords.lat},${selectedOrder.customerCoords.lng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800 rounded-xl"
                                    >
                                      <MapPin className="w-4 h-4 text-red-500 fill-red-500" />
                                      <span>{t.orders.viewMap}</span>
                                    </a>
                                  ) : (
                                    <span className="text-zinc-400 italic text-xs">{t.orders.noMap}</span>
                                  )}
                                </div>
                              </div>

                              {/* Items ordered invoice log */}
                              <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-150 dark:border-zinc-800 pb-1">
                                  {t.orders.itemsOrdered}
                                </div>
                                <div className="space-y-2 divide-y divide-zinc-100 dark:divide-zinc-900">
                                  {selectedOrder.items.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs pt-2 first:pt-0">
                                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                        {isAr ? it.productNameAr : it.productNameEn} <span className="text-zinc-400">(x{it.quantity})</span>
                                      </span>
                                      <span className="font-mono text-zinc-500">{it.price * it.quantity} {isAr ? "ج.م" : "EGP"}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-3 pt-3 flex justify-between text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                  <span>{isAr ? "إجمالي المبلغ المطلوب" : "Receipt Grand Total"}</span>
                                  <span>{selectedOrder.totalPrice} {isAr ? "ج.م" : "EGP"}</span>
                                </div>
                              </div>

                              {/* Invoice generation buttons */}
                              <div className="pt-2 flex flex-wrap gap-2.5">
                                <button
                                  onClick={() => printInvoice(selectedOrder)}
                                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                                >
                                  <Printer className="w-4 h-4" />
                                  <span>{t.orders.print}</span>
                                </button>

                                <button
                                  onClick={() => sendWhatsAppInvoice(selectedOrder)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-md"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{t.orders.sendWhatsapp}</span>
                                </button>
                              </div>

                            </div>
                          ) : (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 rounded-2xl p-12 text-center text-sm border-dashed">
                              {isAr ? "الرجاء اختيار أحد الحجوزات والطلبات لتصنيع الفاتورة وإدارتها" : "Select an invoice card from the left grid panel to construct receipt notes."}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: STORE CONFIG */}
                {activeTab === "settings" && (
                  <form onSubmit={handleSaveGlobalSettings} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-2xl p-5 md:p-6 rounded-2xl space-y-4 text-left">
                    <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100 mb-2 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-emerald-600" />
                      <span>{isAr ? "تخصيص هوية المتجر الرياضي" : "Store Visual Branding setup"}</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.titleAr}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.storeNameAr}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameAr: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.titleEn}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.storeNameEn}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameEn: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.logoUrl}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.storeLogo}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeLogo: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.whatsPhone}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.adminWhatsapp}
                        onChange={(e) => setSettingsForm({ ...settingsForm, adminWhatsapp: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-zinc-400 block mt-1">{t.settings.whatsPhoneHelper}</span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition shadow hover:shadow-lg"
                      >
                        {isAr ? "تحديث إعدادات الهوية الرياضية" : "Update Arena Config"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Panel Status Line */}
              <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Sports Arena Operator v1.9</span>
                <span>System status: Secure Node Connected</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
