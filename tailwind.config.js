/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
      maxWidth: {
        app: '1600px',
      },
      fontSize: {
        'fluid-sm': 'clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem)',
        'fluid-base': 'clamp(0.9375rem, 0.88rem + 0.25vw, 1rem)',
        'fluid-lg': 'clamp(1.0625rem, 0.95rem + 0.45vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.05rem + 0.85vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.375rem, 1.15rem + 1vw, 1.875rem)',
      },
    },
  },
  plugins: [],
};
