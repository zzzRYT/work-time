import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const DEFAULT_API_URL = "https://work-time-production.up.railway.app/graphql";

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
    backgroundColor: "#FFFBF5",
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
      "expo-apple-authentication",
      { usesNonExemptEncryption: false },
    ],
    [
      "@sentry/react-native/expo",
      { organization: "your-org", project: "worktime-app" },
    ],
  ],
  extra: {
    apiUrl: process.env.API_URL || DEFAULT_API_URL,
    supabaseUrl: process.env.SUPABASE_URL || "https://jsdbkcxzifftzbvjsdqd.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZGJrY3h6aWZmdHpidmpzZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTY1MTMsImV4cCI6MjA5MDIzMjUxM30.pggPnVZh5mC5r-f2HteQScasn0_cBE3pQuhaNj7YqR4",
    eas: {
      projectId: "7001d543-835f-43b0-8e00-e3d6fa5540b9",
    },
  },
});
