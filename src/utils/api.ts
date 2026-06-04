// API Connection Utilities for Smart Creator AI Suite

const DEFAULT_BACKEND = "https://ais-pre-2b55aux3rhxjn2afxydwa4-425155535946.europe-west2.run.app";

/**
 * Gets the standard active backend API address.
 */
export function getDefaultBackendUrl(): string {
  if (typeof window === "undefined") return DEFAULT_BACKEND;
  const origin = window.location.origin;
  if (origin.includes(".run.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin;
  }
  return DEFAULT_BACKEND;
}

/**
 * Initializes and persists the backend base URL on load.
 * This runs on startup when running inside the active Cloud Run container.
 */
export function initializeBackendUrl() {
  if (typeof window === "undefined") return;
  try {
    const origin = window.location.origin;
    
    // Auto-heal: If the localStorage holds a stale/dead/legacy backend URL or static hosts like Vercel, clean it up!
    const saved = localStorage.getItem("smart_creator_backend_url");
    if (saved && (
      saved.includes("vercel.app") || 
      saved.includes("ais-pre-4msi") || 
      saved.includes("371641846375") ||
      (!saved.includes(".run.app") && !saved.includes("localhost") && !saved.includes("127.0.0.1"))
    )) {
      localStorage.removeItem("smart_creator_backend_url");
      console.log("[API Auto-Heal] Removed stale or static host backend URL from localStorage.");
    }

    // Always trust and update on Cloud Run or localhost servers
    if (origin.includes(".run.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      localStorage.setItem("smart_creator_backend_url", origin);
    }
  } catch (err) {
    console.warn("Failed to persist backend url in localStorage:", err);
  }
}

/**
 * Gets the persisted API base URL
 */
export function getPersistedBackendUrl(): string {
  if (typeof window === "undefined") return DEFAULT_BACKEND;
  try {
    return localStorage.getItem("smart_creator_backend_url") || DEFAULT_BACKEND;
  } catch {
    return DEFAULT_BACKEND;
  }
}

/**
 * Saves a custom API base URL (e.g. manually specified by the user)
 */
export function savePersistedBackendUrl(url: string) {
  if (typeof window === "undefined") return;
  try {
    let sanitized = url.trim();
    if (sanitized.endsWith("/")) {
      sanitized = sanitized.slice(0, -1);
    }
    localStorage.setItem("smart_creator_backend_url", sanitized);
  } catch (err) {
    console.error("Failed to save custom backend URL:", err);
  }
}

/**
 * Resolves a absolute fetch target API path, considering cross-origin hosting constraints
 */
export function getApiUrl(path: string): string {
  if (typeof window === "undefined") return path;

  const currentOrigin = window.location.origin;

  // If the app is run from inside Vercel, Netlify, or any other hosting (not local or run.app),
  // we cannot use relative router endpoints. Instead, prepend the stored backend origin!
  if (
    !currentOrigin.includes(".run.app") && 
    !currentOrigin.includes("localhost") && 
    !currentOrigin.includes("127.0.0.1")
  ) {
    const base = getPersistedBackendUrl();
    // Ensure accurate slash resolution
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }

  // Local sandbox default relative URL serving
  return path;
}
