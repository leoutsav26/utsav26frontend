/**
 * API configuration. Backend base URL from env.
 * Set VITE_API_URL in .env (e.g. https://your-app.railway.app/api)
 */
const VITE_API_URL = import.meta.env.VITE_API_URL || "";

export const API_BASE = VITE_API_URL.replace(/\/$/, "");
export const AUTH_TOKEN_KEY = "leo_auth_token";
