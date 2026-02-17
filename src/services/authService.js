import { api } from "./apiClient";
import { setAuthToken } from "./apiClient";

/**
 * Auth API – matches backend Users table and auth routes.
 * Expected backend: POST /auth/login, POST /auth/register, GET /auth/me
 */

export async function login(role, email, password = null, profile = null) {
  const body = { role, email: email.trim() };
  if (password) body.password = password;
  if (profile && typeof profile === "object") body.profile = profile;

  const data = await api.post("/auth/login", body);
  const token = data.token ?? data.accessToken ?? data.access_token;
  if (token) setAuthToken(token);
  return data;
}

export async function registerStudent(email, profile) {
  const body = { email: email.trim(), name: profile.name?.trim(), rollNo: String(profile.rollNo ?? "").trim(), phone: String(profile.phone ?? "").trim() };
  const data = await api.post("/auth/register", body);
  const token = data.token ?? data.accessToken ?? data.access_token;
  if (token) setAuthToken(token);
  return data;
}

export async function getMe() {
  const data = await api.get("/auth/me");
  return data.user ?? data;
}

export function logout() {
  setAuthToken(null);
}
