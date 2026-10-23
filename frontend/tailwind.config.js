/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-app': 'var(--bg-app)',
        'bg-header': 'var(--bg-header)',
        'bg-sidebar': 'var(--bg-sidebar)',
        'bg-card': 'var(--bg-card)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-interactive': 'var(--bg-interactive)',
        'divider': 'var(--divider)',
        'border-card': 'var(--border-card)',
        'border-sub': 'var(--border-sub)',
        'border-item': 'var(--border-item)',
        'bg-input': 'var(--bg-input)',
        'bg-btn': 'var(--bg-btn)',
        'bg-nav-active': 'var(--bg-nav-active)',
        'bg-nav-hover': 'var(--bg-nav-hover)',
        'text-main': 'var(--text-main)',
        'text-sub': 'var(--text-sub)',
        'text-dim': 'var(--text-dim)',
        'brand-blue': 'var(--brand-blue)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-indigo': 'var(--accent-indigo)',
        'accent-teal': 'var(--accent-teal)',
        'status-green': 'var(--badge-green-text)',
        'status-green-bg': 'var(--badge-green-bg)',
        'status-amber': 'var(--badge-amber-text)',
        'status-amber-bg': 'var(--badge-amber-bg)',
        'status-red': 'var(--status-critical)',
        'status-red-bg': 'var(--status-critical-bg)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    }
  },
  plugins: [],
}
