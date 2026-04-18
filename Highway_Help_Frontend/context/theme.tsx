import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkUiColors, lightUiColors } from "@/lib/ui/system";

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem("theme_mode");
        if (
          storedMode === "light" ||
          storedMode === "dark" ||
          storedMode === "auto"
        ) {
          setMode(storedMode);
        }
      } finally {
        setIsReady(true);
      }
    };

    loadMode();
  }, []);

  const currentTheme = useMemo(
    () =>
      mode === "auto"
        ? systemColorScheme === "dark"
          ? darkTheme
          : lightTheme
        : mode === "dark"
        ? darkTheme
        : lightTheme,
    [mode, systemColorScheme],
  );

  const updateTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem("theme_mode", newMode).catch(() => {});
  };

  if (!isReady) {
    return null;
  }

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
    primary: lightUiColors.accent,
    primaryDark: lightUiColors.accentDark,
    primaryLight: "#7AD6D2",
    success: lightUiColors.success,
    warning: lightUiColors.warning,
    error: lightUiColors.danger,
    info: lightUiColors.info,
    background: lightUiColors.canvas,
    surface: lightUiColors.surface,
    text: {
      primary: lightUiColors.ink,
      secondary: lightUiColors.muted,
      disabled: lightUiColors.mutedSoft,
    },
    border: lightUiColors.border,
    card: lightUiColors.card,
    input: {
      background: "#FFFFFF",
      border: lightUiColors.border,
      placeholder: lightUiColors.mutedSoft,
    },
  },
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    primary: darkUiColors.accent,
    primaryDark: darkUiColors.accentDark,
    primaryLight: "#8BE0DD",
    success: darkUiColors.success,
    warning: darkUiColors.warning,
    error: darkUiColors.danger,
    info: darkUiColors.info,
    background: darkUiColors.canvas,
    surface: darkUiColors.surface,
    text: {
      primary: darkUiColors.ink,
      secondary: darkUiColors.muted,
      disabled: darkUiColors.mutedSoft,
    },
    border: darkUiColors.border,
    card: darkUiColors.card,
    input: {
      background: "#12202A",
      border: darkUiColors.border,
      placeholder: darkUiColors.mutedSoft,
    },
  },
  isDark: true,
};
