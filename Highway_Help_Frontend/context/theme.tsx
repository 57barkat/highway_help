import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export interface Theme {
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
    card: string;
    input: {
      background: string;
      border: string;
      placeholder: string;
    };
  };
  isDark: boolean;
}

export type ThemeMode = "light" | "dark" | "auto";

export const ThemeContext = createContext<
  | {
      theme: Theme;
      mode: ThemeMode;
      setMode: (mode: ThemeMode) => void;
    }
  | undefined
>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const systemColorScheme = useColorScheme();

  const currentTheme =
    mode === "auto"
      ? systemColorScheme === "dark"
        ? darkTheme
        : lightTheme
      : mode === "dark"
      ? darkTheme
      : lightTheme;

  const updateTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{ theme: currentTheme, mode, setMode: updateTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const lightTheme: Theme = {
  colors: {
    primary: "#8332f5",
    primaryDark: "#5918ae",
    primaryLight: "#a986ff",
    success: "#8332f5",
    warning: "#FFA726",
    error: "#D32F2F",
    info: "#42A5F5",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: {
      primary: "#000000",
      secondary: "#666666",
      disabled: "#CCCCCC",
    },
    border: "#E0E0E0",
    card: "#FFFFFF",
    input: {
      background: "#FFFFFF",
      border: "#E0E0E0",
      placeholder: "#999999",
    },
  },
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    primary: "#8332f5",
    primaryDark: "#5918ae",
    primaryLight: "#a986ff",
    success: "#8332f5",
    warning: "#FFA726",
    error: "#D32F2F",
    info: "#42A5F5",
    background: "#121212",
    surface: "#1E1E1E",
    text: {
      primary: "#FFFFFF",
      secondary: "#B3B3B3",
      disabled: "#666666",
    },
    border: "#333333",
    card: "#1E1E1E",
    input: {
      background: "#1E1E1E",
      border: "#333333",
      placeholder: "#666666",
    },
  },
  isDark: true,
};
