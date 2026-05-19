export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: { 950: '#050510', 900: '#080820', 800: '#0d0d2b' },
      },
      fontFamily: {
        gurmukhi: ['"Noto Sans Gurmukhi"', 'serif'],
      },
    },
  },
  plugins: [],
};

