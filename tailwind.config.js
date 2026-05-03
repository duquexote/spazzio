/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7B1F6A',
          dark: '#5C1550',
          light: '#F7EDF5',
          mid: '#D4A5C9',
          border: '#EAD4E4',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
