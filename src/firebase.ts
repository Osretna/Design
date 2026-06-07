import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Explicit user-supplied configuration values
const firebaseConfig = {
  apiKey: "AIzaSyCI1UU7xVf1N69JCOQnV5mi2ljjGNpotKo",
  authDomain: "design-7a22d.firebaseapp.com",
  databaseURL: "https://design-7a22d-default-rtdb.firebaseio.com",
  projectId: "design-7a22d",
  storageBucket: "design-7a22d.firebasestorage.app",
  messagingSenderId: "311676090280",
  appId: "1:311676090280:web:badc93b8311e634c124f9d",
  measurementId: "G-F2KDFDKE7R"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Test connection on boot according to skill rules
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase initialized and connection tested.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please verify connection or config keys.");
    }
  }
}
testConnection();

// Structured Firestore error logger as requested
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Exception logged:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
