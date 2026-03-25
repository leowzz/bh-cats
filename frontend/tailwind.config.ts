import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#f8f4ea',
          100: '#efe2cb'
        },
        ink: {
          700: '#36413b',
          900: '#1f2722'
        },
        moss: {
          400: '#7c9b6b',
          500: '#627f55',
          700: '#3d5533'
        },
        ember: {
          300: '#efb45d',
          500: '#d98033'
        },
        brick: {
          500: '#a94f3e'
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['"Noto Serif SC"', 'Georgia', 'serif']
      },
      boxShadow: {
        card: '0 18px 40px rgba(54, 65, 59, 0.12)'
      },
      backgroundImage: {
        grain: 'radial-gradient(circle at 1px 1px, rgba(31,39,34,0.08) 1px, transparent 0)'
      }
    }
  },
  plugins: []
} satisfies Config;
