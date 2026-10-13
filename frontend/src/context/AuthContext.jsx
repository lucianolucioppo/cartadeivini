import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(false);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      qc.clear();
      setUser(false);
    }
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
