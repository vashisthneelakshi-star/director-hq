/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'IBM Plex Sans'", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        ink: {
          950: "#0F1216",
          900: "#171B21",
          800: "#20252D",
          700: "#2B313C",
          400: "#8891A0",
          200: "#C7CCD4",
        },
        paper: {
          DEFAULT: "#F8F5EE",
          100: "#FFFFFF",
          200: "#F1ECE0",
        },
        maroon: {
          50: "#FBEEEF",
          100: "#F2D3D5",
          400: "#9A2C3A",
          500: "#7A1E2E",
          600: "#611825",
          700: "#4A121C",
        },
        gold: {
          50: "#FBF3E4",
          200: "#E8CB98",
          400: "#C99A44",
          500: "#B8863E",
          600: "#946A2F",
        },
        ink_text: "#2C2924",
        // semantic
        brand: {
          50: "#FBEEEF",
          100: "#F2D3D5",
          200: "#E3A9AF",
          300: "#C1687A",
          400: "#A83F51",
          500: "#7A1E2E",
          600: "#611825",
          700: "#4A121C",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,16,10,0.06), 0 1px 1px rgba(20,16,10,0.04)",
      },
    },
  },
  plugins: [],
}
