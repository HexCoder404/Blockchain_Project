/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#f4f6f1',
          100: '#e5ebd9',
          200: '#d1ddbb',
          300: '#b8c996',
          400: '#9db272',
          500: '#819951',
          600: '#647b3d',
          700: '#4e5f32',
          800: '#414e2c',
          900: '#384328',
          950: '#1d2412',
        }
      }
    },
  },
  plugins: [],
}
