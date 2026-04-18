import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "app_token";
const REFRESH_TOKEN_KEY = "app_refresh_token";
const USER_KEY = "app_user";
const LEGACY_ACCESS_TOKEN_KEYS = [TOKEN_KEY, "accessToken"];
const LEGACY_REFRESH_TOKEN_KEYS = [REFRESH_TOKEN_KEY, "refreshToken"];

export const getStoredToken = async (): Promise<string | null> => {
  const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (secureToken) {
    return secureToken;
  }

  for (const key of LEGACY_ACCESS_TOKEN_KEYS) {
    const legacyToken = await AsyncStorage.getItem(key);
    if (legacyToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
      await AsyncStorage.removeItem(key);
      return legacyToken;
    }
  }

  return null;
};

export const getStoredUser = async (): Promise<string | null> => {
  const secureUser = await SecureStore.getItemAsync(USER_KEY);
  if (secureUser) {
    return secureUser;
  }

  const legacyUser = await AsyncStorage.getItem(USER_KEY);
  if (legacyUser) {
    await SecureStore.setItemAsync(USER_KEY, legacyUser);
    await AsyncStorage.removeItem(USER_KEY);
    return legacyUser;
  }

  return null;
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
  const secureToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (secureToken) {
    return secureToken;
  }

  for (const key of LEGACY_REFRESH_TOKEN_KEYS) {
    const legacyToken = await AsyncStorage.getItem(key);
    if (legacyToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, legacyToken);
      await AsyncStorage.removeItem(key);
      return legacyToken;
    }
  }

  return null;
};

export const persistSession = async (
  token: string,
  user: unknown,
  refreshToken?: string | null,
) => {
  const serializedUser = JSON.stringify(user);

  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
  await SecureStore.setItemAsync(USER_KEY, serializedUser);
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};
