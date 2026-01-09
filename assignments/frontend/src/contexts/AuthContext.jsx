import { createContext, useContext, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setInitializing(false);
      return;
    }
    try {
      const response = await authService.getCurrentUser();
      setUser(response);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user: userInfo } = response;
    localStorage.setItem("token", token);
    setUser(userInfo);
    return response;
  };

  const register = (email, password, firstName, lastName) =>
    authService.register(email, password, firstName, lastName);

  const verifyEmail = async (token) => {
    const response = await authService.verifyEmail(token);
    const { token: authToken, user: userInfo } = response;
    localStorage.setItem("token", authToken);
    setUser(userInfo);
    return response;
  };

  const forgotPassword = (email) => authService.forgotPassword(email);
  const resetPassword = (token, password) =>
    authService.resetPassword(token, password);

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      register,
      verifyEmail,
      forgotPassword,
      resetPassword,
      logout,
      refreshUser,
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
