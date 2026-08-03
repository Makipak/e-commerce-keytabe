import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        keytabee: {
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          "surface-muted": "#EEF2F6",
          ink: "#012340",
          "ink-muted": "#5B6B7A",
          disabled: "#C3CDD6",
          border: "#DCE3EA",
          accent: "#0572FF",
          success: "#3A6B4A",
          warning: "#B8862E",
          danger: "#B3352C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        skeletonPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        skeletonPulse: "skeletonPulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
