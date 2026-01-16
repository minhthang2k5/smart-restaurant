/* eslint-disable react-refresh/only-export-components */
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
      return null;
    }
    try {
      const response = await authService.getCurrentUser();
      // Backend returns { status: "success", data: { ...profile } }
      const profile = response?.data || response;
      setUser(profile);
      return profile;
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      return null;
    } finally {
      setInitializing(false);
    }
  };

  const loginWithToken = async (token) => {
    if (!token) throw new Error("Missing token");
    localStorage.setItem("token", token);
    const profile = await refreshUser();
    if (!profile) throw new Error("Failed to load user profile");
    return profile;
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user: userInfo } = response.data || response;

    if (!token || !userInfo) {
      throw new Error(response?.message || "Invalid login response format");
    }

    localStorage.setItem("token", token);
    setUser(userInfo);
    return {
      user: userInfo,
      message: response.message,
    };
  };

  const register = async (email, password, firstName, lastName) => {
    const response = await authService.register(
      email,
      password,
      firstName,
      lastName
    );
    return {
      message: response.message,
    };
  };

  const verifyEmail = async (token) => {
    const response = await authService.verifyEmail(token);

    const responseData = response?.data || response;
    const authToken = responseData?.token;
    const userInfo = responseData?.user;

    if (!authToken || !userInfo) {
      throw new Error(
        response?.message || "Invalid verification response format"
      );
    }

    localStorage.setItem("token", authToken);
    setUser(userInfo);

    return {
      user: userInfo,
      message: response.message || "Email verified successfully",
    };
  };

  const forgotPassword = async (email) => {
    const response = await authService.forgotPassword(email);
    return {
      message: response.message,
    };
  };

  const resetPassword = async (token, password) => {
    const response = await authService.resetPassword(token, password);
    return {
      message: response.message,
    };
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem("token");
      sessionStorage.clear();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      loginWithToken,
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
