import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("np_token", data.token);
    setUser(data);
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("np_token");
    setUser(false);
  };

  return <AuthCtx.Provider value={{ user, login, logout, isAdmin: !!user }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
