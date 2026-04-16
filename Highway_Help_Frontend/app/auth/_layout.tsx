import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="verify-OTP" />
    </Stack>
  );
}
