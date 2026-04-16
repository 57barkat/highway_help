import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../../context/theme";
import { StatusBar } from "expo-status-bar";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme } = useTheme();

  useEffect(() => {
    // Simulate splash screen duration
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <StatusBar style="light" />

      {/* Etisalat Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logoImage}
        />
      </View>

      <Text style={styles.titleText}>On Your Way</Text>

      <Text style={styles.subtitleText}>THERE'S ALWAYS A WAY</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  titleText: {
    fontFamily: "Montserrat-Bold",
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 2,
  },
});

export default SplashScreen;
