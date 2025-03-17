import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef9ff',
          100: '#dcf3ff',
          200: '#b3e7ff',
          300: '#75d6ff',
          400: '#2cbdff',
          500: '#00a3ff', // Primary brand color
          600: '#0080ff',
          700: '#0064d3',
          800: '#0052ad',
          900: '#00468d',
        },
        secondary: {
          50: '#f1f8ff',
          100: '#e2f0ff',
          200: '#c0e0ff',
          300: '#8ac8ff',
          400: '#4aa3ff',
          500: '#1a7fff', // Secondary brand color
          600: '#0064d3',
          700: '#004eab',
          800: '#00418e',
          900: '#003a75',
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Accent color
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        dark: {
          primary: '#121926',
          secondary: '#1F2937',
          accent: '#323D4D',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config; 