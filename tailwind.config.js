export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060B18',
          900: '#0A1628',
          800: '#0F1F38',
          700: '#1A3050',
        },
        accent: {
          DEFAULT: '#F97316',
          dim:     '#C2530D',
        },
        gold: '#FBBF24',
      },
      fontFamily: {
        display:  ['"DM Serif Display"', 'Georgia', 'serif'],
        gurmukhi: ['"Noto Sans Gurmukhi"', 'serif'],
        sans:     ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
