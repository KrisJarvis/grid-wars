/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#06060b',
          100: '#0c0c14',
          200: '#141420',
          300: '#1a1a2e',
          400: '#222238',
        },
        accent: {
          DEFAULT: '#6C5CE7',
          light: '#a29bfe',
          glow: 'rgba(108, 92, 231, 0.4)',
        },
        success: '#00B894',
        warning: '#FDCB6E',
        danger: '#E17055',
        muted: '#4a4a66',
        subtle: 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'block-glow': 'blockGlow 0.6s ease-out',
        'meteor': 'meteor 3s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
        blockGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(108, 92, 231, 0.5)' },
          '50%': { boxShadow: '0 0 15px 3px rgba(108, 92, 231, 0.3)' },
          '100%': { boxShadow: '0 0 6px rgba(255, 255, 255, 0.04)' },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'rotate(215deg) translateX(400px)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
