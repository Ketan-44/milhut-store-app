import Constants from 'expo-constants';

export const STAFF_ROLE = 2;

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://192.168.29.22:3000/api';

export const SPLASH_DURATION_MS = 2000;
