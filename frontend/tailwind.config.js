export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#54304f',
        'primary-container': '#70416e',
        secondary: '#a3450d',
        orange: '#fe932c',
        surface: '#fffaf5',
        lavender: '#f8eef5',
        'lavender-dark': '#f0dfeb',
        ink: '#3a293b',
        muted: '#756777',
        line: '#e5d8e2',
      },
      fontFamily: {
        sans: ['Geist Variable', 'sans-serif'],
        display: ['Epilogue Variable', 'sans-serif'],
      },
      borderRadius: { card: '12px' },
      boxShadow: { soft: '0 8px 32px -16px rgba(15,43,92,.18)' },
    },
  },
  plugins: [],
};
