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
        talpa: {
          navy: {
            950: "#070e1c",
            900: "#0d1c36",
            800: "#132949",
            700: "#1b355a",
            600: "#204066",
            500: "#2b4a79",
            400: "#3d649e",
          },
          gold: {
            700: "#634d36",
            600: "#7d6247",
            500: "#967a5f",
            400: "#b59470",
            300: "#c8a97e",
            200: "#e4d3bc",
            100: "#f3ede4",
            50: "#faf7f2",
          },
          sand: {
            50: "#fcfbf9",
            100: "#f8f7f4",
            200: "#f0ede6",
            300: "#e5e0d8",
            400: "#8a8577",
          },
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["Consolas", "'Courier New'", "monospace"],
      },
      boxShadow: {
        talpa: "0 16px 34px rgba(13, 28, 54, 0.12)",
        "talpa-lg": "0 24px 48px rgba(13, 28, 54, 0.18)",
        "talpa-glow": "0 0 25px rgba(200, 169, 126, 0.35)",
        plate: "0 4px 14px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      },
    },
  },
  plugins: [],
};
export default config;
