import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a67ff',
        "primary-dark": '#0f3e99',
        success: '#16a34a',
        danger: '#dc2626',
        warning: '#f59e0b'
      }
    }
  },
  plugins: []
};

export default config;
