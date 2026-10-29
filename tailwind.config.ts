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
          50: '#f2fbf9',
          100: '#d3f4ee',
          200: '#a7e8de',
          300: '#73d5c8',
          400: '#46baae',
          500: '#2c9e93',
          600: '#217e77',
          700: '#1e6560',
          800: '#1c514e',
          900: '#1b4442',
          950: '#0a2727',
        },
        lapis: {
          50: '#f0f5fe',
          100: '#dde8fc',
          500: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#172554',
        },
        gold: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        }
      },
    },
  },
  plugins: [],
};
export default config;
