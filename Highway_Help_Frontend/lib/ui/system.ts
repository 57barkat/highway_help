export const lightUiColors = {
  accent: "#0F8B8D",
  accentDark: "#0B5F61",
  ink: "#10212B",
  canvas: "#F4F7F8",
  card: "#FFFFFF",
  border: "#D8E3E7",
  muted: "#5A6B76",
  mutedSoft: "#8A9AA5",
  success: "#1F9D72",
  warning: "#E79A2F",
  danger: "#D95D48",
  info: "#2C7BE5",
  surface: "#EAF0F2",
  sidebar: "#0E1B22",
  sidebarCard: "#132731",
  overlay: "rgba(10, 20, 26, 0.48)",
} as const;

export const darkUiColors = {
  accent: "#57C4C6",
  accentDark: "#2B9EA1",
  ink: "#F3F7F8",
  canvas: "#071117",
  card: "#0F1C24",
  border: "#1E3340",
  muted: "#9FB1BC",
  mutedSoft: "#738794",
  success: "#37C08A",
  warning: "#F0B24A",
  danger: "#FF7B67",
  info: "#5AA8FF",
  surface: "#13222C",
  sidebar: "#091017",
  sidebarCard: "#0E1820",
  overlay: "rgba(2, 8, 12, 0.72)",
} as const;

export const uiColors = lightUiColors;

export const uiSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const uiRadii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const uiShadows = {
  card: {
    shadowColor: "#081017",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  soft: {
    shadowColor: "#081017",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
};

export const uiTypography = {
  display: 30,
  title: 22,
  heading: 18,
  body: 15,
  caption: 12,
} as const;

export const getUiColors = (isDark: boolean) =>
  isDark ? darkUiColors : lightUiColors;
