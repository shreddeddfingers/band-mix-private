import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        studio: {
          50: "#f6f7f9",
          100: "#edeef2",
          200: "#d7dbe3",
          300: "#b4bccd",
          400: "#8b98b2",
          500: "#6d7a99",
          600: "#576280",
          700: "#474f67",
          800: "#3d4356",
          900: "#1a1e29",
          950: "#0d0f15",
        },
        amp: {
          amber: "#f59e0b",
          orange: "#f97316",
          purple: "#8b5cf6",
          cyan: "#06b6d4",
          emerald: "#10b981",
          rose: "#f43f5e",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
