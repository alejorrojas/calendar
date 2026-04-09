/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        yellow: "#e8e815",
        "yellow-hover": "#d4d512",
        "bg-app": "#f2f2f2",
        text: "#0a0a0a",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
}
