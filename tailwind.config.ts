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
        // Antique brass, not yellow. Gold is an accent in this system — rules,
        // monograms, seals, selected states — never a surface. Desaturated
        // (~30%) so it reads as metal on paper rather than as a highlighter.
        gold: {
          50: "#FAF7F1",
          100: "#F2ECE0",
          200: "#E4D8C1",
          300: "#D2BF9B",
          400: "#BFA47A",
          500: "#A88B5C",
          600: "#8E7348",
          700: "#735C3A",
          800: "#5B4930",
          900: "#463927",
        },
        // The page itself: warm paper, a whiter card stock, a deeper band.
        paper: {
          DEFAULT: "#FBF9F5",
          raised: "#FFFFFF",
          sunk: "#F4F0E8",
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
        // Editorial display: Cormorant for Latin, Amiri for the Arabic glyphs
        // Cormorant doesn't have. Same pairing the invitations use.
        editorial: ["var(--font-cormorant)", "var(--font-amiri)", "Georgia", "serif"],
      },
      /*
       * Three radii, on purpose. 0 for editorial blocks and imagery, 2px for
       * controls (buttons, inputs, badges), 4px for containers (cards,
       * menus). The larger keys collapse onto that scale so legacy
       * rounded-xl / rounded-2xl can't reintroduce floating app cards.
       * `full` stays for true circles: avatars, dots, icon buttons.
       */
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "2px",
        md: "4px",
        lg: "4px",
        xl: "6px",
        "2xl": "6px",
        "3xl": "6px",
      },
      /*
       * Depth comes from paper, rules and contrast — not glow. The only real
       * shadow is `float`, for layers that genuinely sit above the page
       * (menus, popovers). No coloured shadows.
       */
      boxShadow: {
        hairline: "0 0 0 1px rgb(20 18 16 / 0.08)",
        float: "0 18px 40px -24px rgb(20 18 16 / 0.28), 0 0 0 1px rgb(20 18 16 / 0.06)",
        soft: "0 1px 2px 0 rgb(20 18 16 / 0.05)",
        card: "0 0 0 1px rgb(20 18 16 / 0.08)",
      },
      /* Vertical rhythm for page sections: generous, and it breathes with the viewport. */
      spacing: {
        section: "clamp(4.5rem, 3rem + 6vw, 8.5rem)",
        "section-sm": "clamp(3.5rem, 2.5rem + 4vw, 6rem)",
        block: "clamp(2.5rem, 2rem + 2vw, 4rem)",
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
        "foil-travel": {
          "0%": { backgroundPosition: "180% 0" },
          "55%, 100%": { backgroundPosition: "-80% 0" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rule-draw": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
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
        "foil-travel": "foil-travel 7.5s cubic-bezier(0.45,0,0.55,1) infinite",
        "rise-in": "rise-in 1.1s cubic-bezier(0.22,1,0.36,1) forwards",
        "rule-draw": "rule-draw 1.4s cubic-bezier(0.22,1,0.36,1) forwards",
      },
    },
  },
  plugins: [animate],
};

export default config;
