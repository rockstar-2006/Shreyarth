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
          maroon:         '#8B1A3A',
          maroonDark:     '#6B1228',
          maroonLight:    '#B5294F',
          maroonFaint:    '#FAF0F3',
          gold:           '#C9962C',
          goldLight:      '#E8B84B',
          goldFaint:      '#FDF6E7',
          bg:             '#F5F3EF',
          bgAlt:          '#EDE8E0',
          surface:        '#FFFFFF',
          border:         '#E2D9CE',
          borderStrong:   '#C9BFB4',
          text:           '#18181B',
          textSecondary:  '#6B5F57',
          textMuted:      '#9B8E86',
          success:        '#1A7A4A',
          successBg:      '#EDFAF3',
          warning:        '#C9962C',
          warningBg:      '#FDF6E7',
          error:          '#B91C1C',
          errorBg:        '#FEF2F2',
          info:           '#1D4ED8',
          infoBg:         '#EFF6FF',
        },
      },
      fontFamily: {
        sans:    ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm:  '6px',
        md:  '10px',
        lg:  '14px',
        xl:  '20px',
        '2xl': '28px',
      },
      boxShadow: {
        xs:         '0 1px 2px rgba(0,0,0,0.05)',
        sm:         '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        card:       '0 2px 8px rgba(139,26,58,0.06), 0 0 0 1px rgba(139,26,58,0.06)',
        cardHover:  '0 6px 20px rgba(139,26,58,0.12), 0 0 0 1px rgba(139,26,58,0.08)',
        header:     '0 1px 0 #E2D9CE',
        sidebar:    '1px 0 0 rgba(255,255,255,0.06)',
        glow:       '0 0 0 3px rgba(139,26,58,0.15)',
        inner:      'inset 0 1px 4px rgba(0,0,0,0.06)',
        stat:       '0 4px 16px rgba(139,26,58,0.10)',
        float:      '0 8px 32px rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #6B1228 0%, #4A0D1C 100%)',
        'hero-gradient':    'linear-gradient(135deg, #8B1A3A 0%, #5A0F28 50%, #3D0A1C 100%)',
        'card-shimmer':     'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        'gold-gradient':    'linear-gradient(135deg, #C9962C 0%, #E8B84B 100%)',
        'maroon-subtle':    'linear-gradient(135deg, #FAF0F3 0%, #FDF8F9 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
