import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "2rem",
        lg: "3rem",
        xl: "4rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        gold: {
          50: "#fdf9ee",
          100: "#f8edc8",
          200: "#f0da96",
          300: "#e6c165",
          400: "#dcaa42",
          500: "#c9962e",
          600: "#a97622",
          700: "#87591f",
          800: "#6f481f",
          900: "#5e3d1e",
        },
        ink: {
          50: "#f5f5f4",
          100: "#e7e5e2",
          200: "#cbc6c0",
          300: "#a89f97",
          400: "#847970",
          500: "#665c54",
          600: "#4f463f",
          700: "#3a332e",
          800: "#241f1c",
          900: "#141210",
          950: "#0b0a09",
        },
        rose: {
          50: "#fdf3f4",
          100: "#fbe4e6",
          200: "#f6c9cf",
          300: "#eda3ac",
          400: "#e17685",
          500: "#c85566",
          600: "#a83c4d",
          700: "#8b2f3e",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        arabicDisplay: ["var(--font-arabic-display)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 14px)",
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgb(20 18 16 / 0.08)",
        luxe: "0 12px 45px -12px rgb(169 118 34 / 0.35)",
        card: "0 8px 30px -10px rgb(20 18 16 / 0.12)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #f0da96 0%, #c9962e 45%, #87591f 100%)",
        "ink-gradient": "linear-gradient(180deg, #241f1c 0%, #0b0a09 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "seal-breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.035)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 3s linear infinite",
        "seal-breathe": "seal-breathe 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
