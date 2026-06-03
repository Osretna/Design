// API Connection Utilities for Smart Creator AI Suite

const DEFAULT_BACKEND = "https://ais-pre-4msi3yx3phcvtuxpofrnw2-371641846375.europe-west3.run.app";

/**
 * Initializes and persists the backend base URL on load.
 * This runs on startup when running inside the active Cloud Run container.
 */
export function initializeBackendUrl() {
  if (typeof window === "undefined") return;
  try {
    const origin = window.location.origin;
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
