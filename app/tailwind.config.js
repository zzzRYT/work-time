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
        primary: "#6366F1",
        surface: "#F8FAFC",
        studying: "#22C55E",
        late: "#F59E0B",
        vacation: "#3B82F6",
        done: "#94A3B8",
      },
    },
  },
  plugins: [],
};
