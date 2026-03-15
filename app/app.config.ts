import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "WorkTime (Dev)" : "WorkTime",
  slug: "work-time",
  scheme: "work-time",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? "com.worktime.dev" : "com.worktime.app",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    package: IS_DEV ? "com.worktime.dev" : "com.worktime.app",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  updates: {
    url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID}`,
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: "appVersion" as const,
  },
  plugins: [
    "expo-router",
    "expo-asset",
    "expo-updates",
    [
      "@sentry/react-native/expo",
      { organization: "your-org", project: "worktime-app" },
    ],
  ],
  extra: {
    apiUrl: process.env.API_URL || "http://localhost:4000/graphql",
  },
});
