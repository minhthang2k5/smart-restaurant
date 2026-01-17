/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import customerAuthService from "../services/customerAuthService";
import * as sessionService from "../services/sessionService";

const CustomerAuthContext = createContext(null);

const TOKEN_KEY = "customer_token";

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refreshCustomer = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCustomer(null);
      setInitializing(false);
      return null;
    }

    try {
      const response = await customerAuthService.getProfile();
      const profile = response?.data || response;
      setCustomer(profile);
      return profile;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setCustomer(null);
      return null;
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    refreshCustomer();
  }, []);

  const login = async (email, password) => {
    const response = await customerAuthService.login(email, password);
    const payload = response?.data || response;

    const token = payload?.token;
    const userInfo = payload?.user;

    if (!token || !userInfo) {
      throw new Error(payload?.message || "Invalid login response format");
    }

    if (String(userInfo?.role || "").toLowerCase() !== "customer") {
      throw new Error("This account is not a customer account");
    }

    localStorage.setItem(TOKEN_KEY, token);
    setCustomer(userInfo);

    // IDENTITY CLAIM: If there's an active session, link it to this customer
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId && userInfo?.id) {
      try {
        await sessionService.claimSession(sessionId, userInfo.id);
      } catch (error) {
        // Non-fatal: session might already be claimed or completed
        console.warn("Could not claim session:", error?.message);
      }
    }

    return { user: userInfo, message: payload?.message };
  };

  const register = async (email, password, firstName, lastName) => {
    const response = await customerAuthService.register(
      email,
      password,
      firstName,
      lastName
    );
    const payload = response?.data || response;

    return { message: payload?.message };
  };

  const loginWithToken = async (token) => {
    if (!token) throw new Error("Missing token");
    localStorage.setItem(TOKEN_KEY, token);
    const profile = await refreshCustomer();
    if (!profile) throw new Error("Failed to load customer profile");

    if (String(profile?.role || "").toLowerCase() !== "customer") {
      localStorage.removeItem(TOKEN_KEY);
      setCustomer(null);
      throw new Error("Google OAuth is for customers only");
    }

    // IDENTITY CLAIM: If there's an active session, link it to this customer
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId && profile?.id) {
      try {
        await sessionService.claimSession(sessionId, profile.id);
      } catch (error) {
        // Non-fatal: session might already be claimed or completed
        console.warn("Could not claim session:", error?.message);
      }
    }

    return profile;
  };

  const updateProfile = async (payload) => {
    const response = await customerAuthService.updateProfile(payload);
    await refreshCustomer();
    return response?.data || response;
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
  };

  const value = {
    customer,
    initializing,
    login,
    register,
    loginWithToken,
    refreshCustomer,
    updateProfile,
    logout,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx)
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
