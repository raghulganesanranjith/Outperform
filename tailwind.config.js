/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', '"Georgia"', 'serif'],
        sans:  ['"Source Sans 3"', '"Helvetica Neue"', 'sans-serif'],
        mono:  ['"Source Code Pro"', 'monospace'],
      },
      letterSpacing: {
        editorial: '0.04em',
        'wide-xl':  '0.12em',
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
