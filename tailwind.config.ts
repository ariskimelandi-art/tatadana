import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#FF6B00", // TataDana Primary Orange
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        surface: {
          light: "#FAFAFA",
          card: "#FFFFFF",
          muted: "#F4F4F5",
          border: "#E4E4E7",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.04), 0 8px 30px rgba(0, 0, 0, 0.04)",
        orange: "0 10px 25px -3px rgba(255, 107, 0, 0.25), 0 4px 6px -4px rgba(255, 107, 0, 0.15)",
        glow: "0 0 0 3px rgba(255, 107, 0, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
