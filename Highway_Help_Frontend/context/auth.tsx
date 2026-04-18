import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/api/api";
import { clearSession, getStoredToken, getStoredUser, persistSession } from "@/lib/auth-storage";
import { getValidAccessToken } from "@/lib/auth-client";

export type Role = "user" | "helper";

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    phoneNumber: string,
    password: string,
    role: Role,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  setAuthenticated: (authenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  const setAuthenticated = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
  };

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const token = await getStoredToken();
        const userStr = await getStoredUser();

        const validToken = token ? await getValidAccessToken() : null;

        if (validToken && userStr) {
          setUser(JSON.parse(userStr));
          setIsAuthenticated(true);
        } else {
          await clearSession();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth load error:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      await persistSession(accessToken, user, refreshToken);

      setUser(user);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const signup = async (
    name: string,
    email: string,
    phoneNumber: string,
    password: string,
    role: Role,
  ): Promise<boolean> => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        phoneNumber,
        password,
        role,
      });

      if (response.data?.accessToken && response.data?.user) {
        await persistSession(
          response.data.accessToken,
          response.data.user,
          response.data.refreshToken,
        );
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await clearSession();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        signup,
        logout,
        setAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
