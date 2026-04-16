import React from "react";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/context/theme";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<{ size: number; color: string; style?: any }>;
  style?: ViewStyle;
}

export default function AppButton(props: AppButtonProps) {
  const {
    title,
    onPress,
    variant = "primary",
    size = "medium",
    disabled = false,
    loading = false,
    icon: IconComponent,
    style = {},
  } = props;
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingHorizontal: 16, paddingVertical: 8 },
      medium: { paddingHorizontal: 24, paddingVertical: 12 },
      large: { paddingHorizontal: 32, paddingVertical: 16 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled
          ? theme.colors.text.disabled
          : theme.colors.primary,
      },
      secondary: {
        backgroundColor: disabled
          ? theme.colors.text.disabled
          : theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: disabled
          ? theme.colors.text.disabled
          : theme.colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    } as ViewStyle;
  };

  const getTextColor = () => {
    if (disabled) {
      if (variant === "primary") return "#FFFFFF";
      return theme.colors.text.disabled;
    }
    if (variant === "primary") return "#FFFFFF";
    if (variant === "outline") return theme.colors.primary;
    return theme.colors.text.primary;
  };

  const getFontSize = () => {
    const sizes = {
      small: 14,
      medium: 16,
      large: 18,
    };
    return sizes[size];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {IconComponent && (
            <IconComponent
              size={getFontSize()}
              color={getTextColor()}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{
              fontFamily: "Montserrat-SemiBold",
              fontSize: getFontSize(),
              color: getTextColor(),
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
