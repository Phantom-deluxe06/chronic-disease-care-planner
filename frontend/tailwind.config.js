/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Professional Medical Tech Theme
        'primary': {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06B6D4', // Main Cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        'navy': {
          800: '#1e293b',
          900: '#0f172a', // Deep Navy background
        },
        'slate': {
          700: '#334155',
          800: '#1e293b', // Card background
        }
      }
    },
  },
  plugins: [],
};
