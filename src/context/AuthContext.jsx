import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAppData } from "./AppData";
import { generateLeoId } from "../utils/leoId";
import * as authService from "../services/authService";
import { getAuthToken } from "../services/apiClient";

const AuthContext = createContext(null);

const AUTH_USER_KEY = "leo_current_user";

function loadStoredUser() {
  try {
    const s = localStorage.getItem(AUTH_USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const { users, setUsers, useApi } = useAppData();
  const [user, setUser] = useState(loadStoredUser());

  const persistUser = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  // When API is enabled and we have a token, restore user from /auth/me
  useEffect(() => {
    if (!useApi || !getAuthToken()) return;
    if (user) return;
    authService
      .getMe()
      .then((data) => persistUser(data))
      .catch(() => persistUser(null));
  }, [useApi]);

  const login = useCallback(
    async (role, email, password = null, profile = null) => {
      if (useApi) {
        try {
          if (role === "student" && profile?.name && profile?.rollNo && profile?.phone) {
            const data = await authService.registerStudent(email, profile);
            persistUser(data.user ?? data);
            return { ok: true };
          }
          const data = await authService.login(role, email, password, profile);
          if (data.needsProfile) return { ok: false, needsProfile: true };
          persistUser(data.user ?? data);
          return { ok: true };
        } catch (err) {
          const msg = err?.body?.message ?? err?.message ?? "Login failed";
          return { ok: false, message: msg };
        }
      }

      // Offline / mock: use AppData users
      const students = users?.students || [];
      const coordinators = users?.coordinators || [];
      const admins = users?.admins || [];

      if (role === "student") {
        const found = students.find((s) => s.email?.toLowerCase() === email.toLowerCase());
        if (found) {
          persistUser(found);
          return { ok: true };
        }
        if (profile?.name && profile?.rollNo && profile?.phone) {
          const newStudent = {
            id: "stu-" + Date.now(),
            email: email.trim(),
            role: "student",
            name: profile.name.trim(),
            rollNo: String(profile.rollNo).trim(),
            phone: String(profile.phone).trim(),
            leoId: generateLeoId(),
            createdAt: new Date().toISOString(),
          };
          setUsers((u) => ({ ...u, students: [...(u?.students || []), newStudent] }));
          persistUser(newStudent);
          return { ok: true };
        }
        return { ok: false, needsProfile: true };
      }

      if (role === "coordinator") {
        const found = coordinators.find((c) => c.email?.toLowerCase() === email.toLowerCase());
        if (!found) return { ok: false, message: "No coordinator found with this email." };
        if (found.password !== password) return { ok: false, message: "Wrong password." };
        if (found.status !== "approved") return { ok: false, message: "Your account is not approved yet." };
        persistUser(found);
        return { ok: true };
      }

      if (role === "admin") {
        const found = admins.find((a) => a.email?.toLowerCase() === email.toLowerCase());
        if (!found) return { ok: false, message: "No admin found with this email." };
        if (found.password !== password) return { ok: false, message: "Wrong password." };
        persistUser(found);
        return { ok: true };
      }

      return { ok: false, message: "Invalid role." };
    },
    [users, setUsers, persistUser, useApi]
  );

  const logout = useCallback(() => {
    if (useApi) authService.logout();
    persistUser(null);
  }, [persistUser, useApi]);

  const value = { user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
