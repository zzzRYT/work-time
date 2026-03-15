import { useCallback, useEffect, useRef } from "react";
import { Animated, Text } from "react-native";
import { cn } from "@shared/lib/cn";

type ToastProps = {
  message: string | null;
  variant?: "error" | "success";
  onDismiss: () => void;
  duration?: number;
  className?: string;
};

const BG_COLOR = {
  error: "bg-red-500",
  success: "bg-green-500",
};

export function Toast({
  message,
  variant = "error",
  onDismiss,
  duration = 3000,
  className,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!message) return;

    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDismissRef.current());
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className={cn(
        "absolute bottom-20 left-4 right-4 rounded-xl px-4 py-3",
        BG_COLOR[variant],
        className
      )}
    >
      <Text className="text-white text-sm font-medium text-center">
        {message}
      </Text>
    </Animated.View>
  );
}
