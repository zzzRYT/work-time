import "../../global.css";
import { Slot } from "expo-router";
import { Providers } from "@app/providers";

export default function RootLayout() {
  return (
    <Providers>
      <Slot />
    </Providers>
  );
}
