/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        s1: 'var(--surface-1)',
        s2: 'var(--surface-2)',
        s3: 'var(--surface-3)',
        well: 'var(--well)',
        ink: 'var(--text)',
        ink2: 'var(--text-2)',
        ink3: 'var(--text-3)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-soft': 'var(--accent-soft)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
      },
      fontFamily: {
        // Both families have Malayalam letters, so Malayalam titles match the rest of the page.
        sans: ["'Anek Malayalam Variable'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        serif: ["'Newsreader Variable'", "'Noto Serif Malayalam Variable'", 'Georgia', 'serif'],
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        float: 'var(--shadow-float)',
      },
    },
  },
  plugins: [],
}
