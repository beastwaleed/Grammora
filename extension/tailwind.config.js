/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './entrypoints/**/*.{html,ts,tsx}',
    './components/**/*.{html,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0EEFF',
          100: '#E2DEFF',
          200: '#C7BFFF',
          300: '#A697FF',
          400: '#846DFA',
          500: '#6258E8', // Primary brand token
          600: '#5147D4', // Primary hover token
          700: '#4338CA', // Primary active token
          800: '#3730A3',
          900: '#312E81',
        },
        surface: {
          canvas: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#F1F5F9',
          border: '#E2E8F0',
          'border-strong': '#CBD5E1',
        },
        content: {
          main: '#172033',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        state: {
          success: '#16A34A',
          'success-soft': '#DCFCE7',
          warning: '#D97706',
          'warning-soft': '#FEF3C7',
          error: '#DC2626',
          'error-soft': '#FEE2E2',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        toolbar: '0 4px 12px -2px rgba(17, 24, 39, 0.08), 0 2px 6px -1px rgba(17, 24, 39, 0.04)',
        popover: '0 10px 25px -5px rgba(17, 24, 39, 0.12), 0 8px 10px -6px rgba(17, 24, 39, 0.04)',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
