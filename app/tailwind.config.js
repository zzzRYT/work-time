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
        surface: "#FFF7EE",
        "surface-hover": "#FFF0DC",
        primary: {
          DEFAULT: "#F07A5A",
          light: "#FEF0EB",
          dark: "#D4603D",
        },
        "text-primary": "#2C1F14",
        "text-muted": "#8A7060",
        "text-subtle": "#B8A898",
        border: "#EDE4D8",
        studying: {
          DEFAULT: "#3DAD9E",
          bg: "#E6F7F5",
        },
        late: {
          DEFAULT: "#E8824A",
          bg: "#FEF0E6",
        },
        vacation: {
          DEFAULT: "#6096DB",
          bg: "#EEF3FD",
        },
        done: {
          DEFAULT: "#A0917F",
          bg: "#F5F0EA",
        },
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "20px",
      },
    },
  },
  plugins: [],
};
