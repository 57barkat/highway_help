import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface AdminAuthContextType {
  adminToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem("adminToken"),
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminToken) {
      navigate("/login");
    }
  }, [adminToken, navigate]);

  const login = async (email: string, password: string) => {
    const res = await axios.post("http://localhost:3000/api/admin/login", {
      email,
      password,
    });

    const token = res.data.token;
    localStorage.setItem("adminToken", token);
    setAdminToken(token);
    navigate("/dashboard"); // redirect after login
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    navigate("/login");
  };

  return (
    <AdminAuthContext.Provider value={{ adminToken, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};
