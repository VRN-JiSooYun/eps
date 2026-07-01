/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        line: "#d7dde8",
        panel: "#f6f8fb",
        signal: "#d94f21"
      }
    }
  },
  plugins: []
};
