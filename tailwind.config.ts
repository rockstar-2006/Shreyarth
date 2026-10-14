import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        smvitm: {
          maroon: '#8B1A3A',
          maroonDark: '#6B1228',
          maroonLight: '#B5294F',
          gold: '#C9962C',
          goldLight: '#E8B84B',
          bg: '#FAF7F2',
          surface: '#FFFFFF',
          border: '#E8E0D5',
          text: '#1A1A1A',
          textSecondary: '#5A5149',
          success: '#2D7A4F',
          warning: '#C9962C',
          error: '#C0392B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(139,26,58,0.08)',
        cardHover: '0 4px 16px rgba(139,26,58,0.14)',
        header: '0 2px 8px rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
