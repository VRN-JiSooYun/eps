/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        pine: "#0f766e",
        coral: "#e76f51",
        voronoi: {
          orange: "#E85324",
          gray: {
            100: "#F5F5F5",
            300: "#E0E0E0",
            500: "#9E9E9E",
            800: "#424242",
            900: "#212121"
          }
        }
      }
    }
  },
  plugins: []
};
