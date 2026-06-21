import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Milhut Store',
  slug: 'milhut-store-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icons/newlogo.png',
  scheme: 'milhutstore',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/icons/newlogo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.milhut.store',
    infoPlist: {
      NSCameraUsageDescription:
        'Camera access is required to scan batch QR codes.',
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  },
  android: {
    package: 'com.milhut.store',
    adaptiveIcon: {
      foregroundImage: './assets/icons/newlogo.png',
      backgroundColor: '#ffffff',
    },
    permissions: ['CAMERA'],
  },
  web: {
    favicon: './assets/icons/newlogo.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow Milhut Store to access your camera to scan batch QR codes.',
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.29.22:3000/api',
  },
});
