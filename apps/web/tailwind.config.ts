import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        keytabee: {
          bg: "#FAFAF8",
          surface: "#FFFFFF",
          "surface-muted": "#F2F0EB",
          ink: "#171717",
          "ink-muted": "#6B6B65",
          disabled: "#C9C5B8",
          border: "#E6E3DC",
          accent: "#A8501F",
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
