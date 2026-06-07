import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ============================================================================
// ⚠️ FIREBASE CONFIGURATION / كود إعدادات الفايربيز
// ============================================================================
// ENGLISH: You can change the Firebase Configuration here to connect to another project.
// ARABIC: يمكنك تعديل كود الإعدادات هذا لربط التطبيق بمشروع فايربيز آخر بسهولة.
// ============================================================================
export const firebaseConfig = {
  apiKey: "AIzaSyB-fYCZm9abrNSQx8GfhjU4B_pZ8FsbvWE",
  authDomain: "store-sports.firebaseapp.com",
  databaseURL: "https://store-sports-default-rtdb.firebaseio.com",
  projectId: "store-sports",
  storageBucket: "store-sports.firebasestorage.app",
  messagingSenderId: "923736199436",
  appId: "1:923736199436:web:4d42c5aa0972c811f53929",
  measurementId: "G-42BP4L1N8T"
};

// Default Products in case database is empty or connection is offline
const DEFAULT_PRODUCTS: any[] = [];

const DEFAULT_SETTINGS = {
  storeNameAr: "فتنس برو ستور",
  storeNameEn: "Fitness Pro Store",
  storeLogo: "https://images.unsplash.com/photo-1434596994096-19cc4e8f1761?q=80&w=200&auto=format&fit=crop",
  adminWhatsapp: "201012345678" // Default administrative phone number
};

// Initialize Firebase App helper with error catching
let app: any;
let db: any = null;
export let auth: any = null;
let isFirebaseActive = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  auth = getAuth(app);
  isFirebaseActive = true;
  console.log("Firebase initialized successfully! / تم تشغيل فايربيز بنجاح!");
} catch (error) {
  console.error("Firebase Initialization Error, switching to offline fallback mode: ", error);
}

// ----------------------------------------------------------------------------
// Local Storage helpers for robust fallback
// ----------------------------------------------------------------------------
const localGet = (key: string) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const localSet = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error setting local storage key", key, error);
  }
};

// Base initializers for offline fallback mode
if (!localGet("sports_products")) {
  localSet("sports_products", DEFAULT_PRODUCTS);
}
if (!localGet("sports_settings")) {
  localSet("sports_settings", DEFAULT_SETTINGS);
}
if (!localGet("sports_orders")) {
  localSet("sports_orders", []);
}

// ============================================================================
// Robust Promise Timeout Helper / أداة الحماية من بطء الاتصال بالخادم
// ============================================================================
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`Database query timed out after ${timeoutMs}ms, activating seamless offline cache fallback.`);
      resolve(fallbackValue);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Check if a Firebase Error is due to Missing or Insufficient Permissions
function isPermissionError(err: any): boolean {
  const msg = err?.message || String(err);
  return (
    msg.toLowerCase().includes("permission-denied") ||
    msg.toLowerCase().includes("insufficient permissions") ||
    msg.toLowerCase().includes("missing or insufficient permissions")
  );
}

// ============================================================================
// SYSTEM SECURITY REQUIREMENT: Structured Firestore Error Reporter
// ============================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================================================
// BACKEND WRAPPERS (Products / Settings / Orders) WITH RESILIENT TIMEOUTS
// ============================================================================

export async function getProducts(): Promise<any[]> {
  if (isFirebaseActive && db) {
    try {
      const fetchPromise = (async () => {
        const snap = await getDocs(collection(db, "products"));
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        return list;
      })();

      // Limit response wait to 1500 seconds, fallback to null so local list takes over instantly
      const list = await withTimeout(fetchPromise, 1500, null);
      if (list && list.length > 0) {
        localSet("sports_products", list);
        return list;
      }
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.LIST, "products");
      } else {
        console.warn("Firestore error fetching products, playing offline data", e);
      }
    }
  }
  return localGet("sports_products") || DEFAULT_PRODUCTS;
}

export async function saveProduct(product: any): Promise<void> {
  // Update local storage instantly
  const local = localGet("sports_products") || [];
  const idx = local.findIndex((p: any) => p.id === product.id);
  if (idx > -1) {
    local[idx] = product;
  } else {
    local.push(product);
  }
  localSet("sports_products", local);

  if (isFirebaseActive && db) {
    try {
      await withTimeout(setDoc(doc(db, "products", product.id), product), 1500, null);
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.WRITE, `products/${product.id}`);
      } else {
        console.error("Firestore error saving product:", e);
      }
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  // Update local storage instantly
  const local = localGet("sports_products") || [];
  const filtered = local.filter((p: any) => p.id !== id);
  localSet("sports_products", filtered);

  if (isFirebaseActive && db) {
    try {
      await withTimeout(deleteDoc(doc(db, "products", id)), 1500, null);
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
      } else {
        console.error("Firestore error deleting product:", e);
      }
    }
  }
}

export async function getOrders(): Promise<any[]> {
  if (isFirebaseActive && db) {
    try {
      const fetchPromise = (async () => {
        const snap = await getDocs(collection(db, "orders"));
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        return list;
      })();

      const list = await withTimeout(fetchPromise, 1500, null);
      if (list) {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localSet("sports_orders", list);
        return list;
      }
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.LIST, "orders");
      } else {
        console.warn("Firestore error fetching orders, rendering offline list", e);
      }
    }
  }
  const local = localGet("sports_orders") || [];
  local.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return local;
}

export async function addOrder(order: any): Promise<void> {
  const local = localGet("sports_orders") || [];
  local.unshift(order);
  localSet("sports_orders", local);

  if (isFirebaseActive && db) {
    try {
      await withTimeout(setDoc(doc(db, "orders", order.id), order), 1500, null);
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.WRITE, `orders/${order.id}`);
      } else {
        console.error("Firestore error adding order:", e);
      }
    }
  }
}

export async function updateOrder(order: any): Promise<void> {
  const local = localGet("sports_orders") || [];
  const idx = local.findIndex((o: any) => o.id === order.id);
  if (idx > -1) {
    local[idx] = order;
  }
  localSet("sports_orders", local);

  if (isFirebaseActive && db) {
    try {
      await withTimeout(setDoc(doc(db, "orders", order.id), order), 1500, null);
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.WRITE, `orders/${order.id}`);
      } else {
        console.error("Firestore error updating order status:", e);
      }
    }
  }
}

export async function getStoreSettings(): Promise<any> {
  if (isFirebaseActive && db) {
    try {
      const fetchPromise = (async () => {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) {
          return snap.data();
        }
        return null;
      })();

      const data = await withTimeout(fetchPromise, 1500, null);
      if (data) {
        localSet("sports_settings", data);
        return data;
      }
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.GET, "settings/global");
      } else {
        console.warn("Firestore error retrieving store settings:", e);
      }
    }
  }
  return localGet("sports_settings") || DEFAULT_SETTINGS;
}

export async function saveStoreSettings(settings: any): Promise<void> {
  localSet("sports_settings", settings);

  if (isFirebaseActive && db) {
    try {
      await withTimeout(setDoc(doc(db, "settings", "global"), settings), 1500, null);
    } catch (e) {
      if (isPermissionError(e)) {
        handleFirestoreError(e, OperationType.WRITE, "settings/global");
      } else {
        console.error("Firestore error saving settings:", e);
      }
    }
  }
}
