/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FYP University Official Palette (Academic Indigo, Royal Blue & Amber)
        'gov-dark':    '#0f172a',   // Deep Slate Navy
        'gov-primary': '#4f46e5',   // Indigo Accent
        'gov-mid':     '#2563eb',   // Medium Royal Blue
        'gov-light':   '#eef2ff',   // Soft Indigo Tint
        'gov-accent':  '#f59e0b',   // Academic Amber
        'gov-blue':    '#1e3a8a',   // Academic Navy Blue

        // FYP Portal Semantic Branding
        'fyp': {
          'navy':   '#0f172a',
          'dark':   '#1e1b4b',
          'blue':   '#4f46e5',
          'gold':   '#f59e0b',
          'amber':  '#d97706',
          'light':  '#eef2ff',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
}
