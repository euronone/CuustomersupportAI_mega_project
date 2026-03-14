import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0A66C2",
          hover: "#004182",
        },
        surface: "#FFFFFF",
        bg: "#F3F6F8",
        border: "#E5E7EB",
        "input-border": "#D1D5DB",
        "text-primary": "#111827",
        "text-muted": "#6B7280",
        success: "#057642",
        warning: "#B45309",
        error: "#B91C1C",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1200px",
      },
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
