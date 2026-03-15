import * as Sentry from "@sentry/react-native";

export function initSentry() {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: process.env.APP_VARIANT || "development",
  });
}

export { Sentry };
