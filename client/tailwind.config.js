/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf2f8',
          100: '#fbe7ed',
          200: '#f7d1dc',
          300: '#f0a8be',
          400: '#e6759a',
          500: '#d94473',
          600: '#c2185b',
          700: '#a31545',
          800: '#8b1538',
          900: '#771632',
        },
        burgundy: {
          50: '#fdf4f3',
          100: '#fce7e6',
          200: '#f9d5d3',
          300: '#f4b7b2',
          400: '#ec8983',
          500: '#e15d55',
          600: '#cd3f35',
          700: '#ab2f26',
          800: '#8e2823',
          900: '#782622',
        }
      },
      fontFamily: {
        'serif': ['Crimson Pro', 'serif'],
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
      },
      gridTemplateColumns: {
        '21': 'repeat(21, minmax(0, 1fr))',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}