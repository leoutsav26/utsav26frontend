import { API_BASE, AUTH_TOKEN_KEY } from "../config/api";

export class ApiError extends Error {
  constructor(message, status, body = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const LEGACY_TOKEN_KEY = "token";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

/**
 * Central API request helper. Attaches auth token, parses JSON, throws ApiError on non-2xx.
 * @param {string} method - GET, POST, PUT, PATCH, DELETE
 * @param {string} path - e.g. "/events" (relative to API_BASE)
 * @param {object|null} body - optional JSON body
 * @returns {Promise<object|array>} parsed response
 */
export async function request(method, path, body = null) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body != null && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
