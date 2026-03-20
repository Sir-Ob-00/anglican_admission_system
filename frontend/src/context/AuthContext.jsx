/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

function readStored() {
  const token = localStorage.getItem("aas_token");
  const rawUser = localStorage.getItem("aas_user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  return { token: token || null, user };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStored().token);
  const [user, setUser] = useState(() => readStored().user);
  const [isBooting, setIsBooting] = useState(() => Boolean(readStored().token));

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!token) {
        if (!ignore) setIsBooting(false);
        return;
      }

      if (!ignore) setIsBooting(true);
      try {
        const me = await authService.me();
        if (ignore) return;
        localStorage.setItem("aas_user", JSON.stringify(me));
        setUser(me);
      } catch {
        if (ignore) return;
        localStorage.removeItem("aas_token");
        localStorage.removeItem("aas_user");
        setToken(null);
        setUser(null);
      } finally {
        if (!ignore) setIsBooting(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [token]);

  const value = useMemo(() => {
    const isAuthenticated = Boolean(token);

    return {
      token,
      user,
      role: user?.role || "parent",
      isAuthenticated,
      isBooting,
      async login(credentials) {
        const data = await authService.login(credentials);
        localStorage.setItem("aas_token", data.token);
        localStorage.setItem("aas_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      logout() {
        localStorage.removeItem("aas_token");
        localStorage.removeItem("aas_user");
        setToken(null);
        setUser(null);
      },
    };
  }, [token, user, isBooting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
