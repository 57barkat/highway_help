import { StyleSheet } from "react-native";

export const colors = {
  primary: "#2962FF",
  secondary: "#E3F2FD",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#212121",
  textSecondary: "#757575",
  border: "#E0E0E0",
  highlight: "#E8F4FD",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  danger: "#F44336",
};

export const textStyles = StyleSheet.create({
  heading1: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    lineHeight: 40,
  },
  heading2: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    lineHeight: 32,
  },
  heading3: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  bodySecondary: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.card,
    textAlign: "center",
  },
});

export const commonStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    ...commonStyles.button,
    backgroundColor: colors.primary,
  },
  secondary: {
    ...commonStyles.button,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  danger: {
    ...commonStyles.button,
    backgroundColor: colors.danger,
  },
  outline: {
    ...commonStyles.button,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
});
