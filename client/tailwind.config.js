/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ct: '#5D79AE',
        t: '#EAC344',
      },
    },
  },
  plugins: [],
}
