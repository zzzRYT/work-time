/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#FFFBF5",
        surface: "#FFF7ED",
        "surface-hover": "#FFF1E0",
        primary: {
          DEFAULT: "#0D9488",
          light: "#CCFBF1",
          dark: "#0F766E",
        },
        "text-primary": "#1C1917",
        "text-muted": "#78716C",
        "text-subtle": "#A8A29E",
        border: "#E7E5E4",
        studying: {
          DEFAULT: "#0D9488",
          bg: "#CCFBF1",
        },
        late: {
          DEFAULT: "#EA580C",
          bg: "#FFF7ED",
        },
        vacation: {
          DEFAULT: "#2563EB",
          bg: "#EFF6FF",
        },
        done: {
          DEFAULT: "#78716C",
          bg: "#F5F5F4",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};
