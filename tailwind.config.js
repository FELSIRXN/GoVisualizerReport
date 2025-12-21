/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#101010',
          green: '#ffffff', // Using 'green' key for white to minimize refactoring, effectively remapping it
          text: '#e5e5e5',
          border: '#333333',
          'green-dim': '#a3a3a3',
          orange: '#f97316', // Orange-500
          'orange-dark': '#ea580c', // Orange-600
          'orange-light': '#fb923c', // Orange-400
        },
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'typing': 'typing 3s steps(40, end)',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

