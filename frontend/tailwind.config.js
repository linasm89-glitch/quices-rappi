/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF441F',
          50:  '#FFF1EE',
          100: '#FFE0D8',
          200: '#FFC0B0',
          300: '#FF9B82',
          400: '#FF6E4D',
          500: '#FF441F',
          600: '#F02900',
          700: '#CC2200',
          800: '#A81C00',
          900: '#8A1800',
          950: '#4D0D00',
        },
        rappi: {
          orange: '#FF441F',
          dark:   '#CC3518',
          light:  '#FF6E4D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'countdown-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.08)', opacity: '0.85' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'countdown-pulse': 'countdown-pulse 1s ease-in-out infinite',
        'fade-in-up':      'fade-in-up 0.4s ease-out both',
        'spin-slow':       'spin-slow 1.4s linear infinite',
        'bounce-in':       'bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
      },
      boxShadow: {
        'card':    '0 4px 24px 0 rgba(0,0,0,0.08)',
        'card-lg': '0 8px 40px 0 rgba(0,0,0,0.12)',
        'orange':  '0 4px 20px 0 rgba(255,68,31,0.30)',
      },
    },
  },
  plugins: [],
}
