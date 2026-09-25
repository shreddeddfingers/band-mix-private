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
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          hover: "rgb(var(--brand-rgb-hover) / <alpha-value>)",
          light: "var(--brand-light)",
          surface: "var(--brand-surface)",
          border: "var(--brand-border)",
          text: "var(--brand-text)",
          contrast: "var(--brand-contrast-text)",
        },
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "rgb(var(--brand-rgb) / 0.85)",
          400: "rgb(var(--brand-rgb) / <alpha-value>)",
          500: "rgb(var(--brand-rgb) / <alpha-value>)",
          600: "rgb(var(--brand-rgb-hover) / <alpha-value>)",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        amp: {
          amber: "rgb(var(--brand-rgb) / <alpha-value>)",
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
