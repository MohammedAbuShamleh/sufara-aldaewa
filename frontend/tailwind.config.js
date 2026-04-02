/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0D9488',
          dark: '#0F766E',
          light: '#14B8A6',
        },
        gold: {
          DEFAULT: '#D4A017',
          light: '#F0C14B',
        },
        cyan: '#06B6D4',
        coral: {
          DEFAULT: '#F43F5E',
          light: '#FB7185',
        },
        lightBlueGray: '#E0F2F1',
        darkGray: '#1E293B',
        lightGray: '#F8FAFC',
      },
      fontFamily: {
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgb(13 148 136 / 0.08), 0 4px 6px -4px rgb(13 148 136 / 0.05)',
        'soft-lg': '0 10px 40px -10px rgb(13 148 136 / 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

