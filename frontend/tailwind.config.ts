import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "var(--background)",
          sidebar: "var(--sidebar-bg)",
          card: "var(--card)",
          border: "var(--border)",
          hover: "var(--muted)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--accent)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary)",
        },
        muted: {
          DEFAULT: "var(--muted-foreground)",
          dark: "var(--secondary)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sohne)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-signifier)", "Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
