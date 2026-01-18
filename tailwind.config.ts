import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff8f5',
          100: '#ffe8dc',
          200: '#ffd1b9',
          300: '#ffb996',
          400: '#ffa273',
          500: '#ff8c42',
          600: '#ff6b35',
          700: '#e65a2e',
          800: '#cc4927',
          900: '#b33820',
        },
      },
    },
  },
  plugins: [],
}
export default config
