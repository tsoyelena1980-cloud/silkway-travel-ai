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
        silk: {
          50: '#fbf9f5',
          100: '#f3ede2',
          200: '#e5d7c1',
          300: '#d4af37',
          400: '#c59b27',
          500: '#16697a',
          600: '#11515e',
          700: '#0d3b46',
          800: '#0a2a33',
          900: '#081d26',
          950: '#060c17',
        },
        lapis: {
          50: '#f4f6fb',
          100: '#e4e9f5',
          500: '#1e3a5f',
          700: '#142744',
          800: '#0f1e36',
          900: '#0b132b',
          950: '#060a17',
        },
        gold: {
          200: '#f9f1d2',
          300: '#f1df9e',
          400: '#e3c364',
          500: '#d4af37',
          600: '#b38e22',
        },
      },
    },
  },
  plugins: [],
};
export default config;
