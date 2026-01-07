import type { Config } from 'tailwindcss';

export default {
  content: [],
  safelist: [
    // Custom border utilities
    'border-dotted-1',
    'border-dotted-2',
    'border-dashed-1',
    'border-t-dotted',
    'border-b-dotted',
    'border-l-dotted',
    'border-r-dotted',
    // Custom shadow utilities
    'shadow-blueprint',
    'shadow-blueprint-hover',
    // Grid backgrounds
    'dotted-grid-background',
    'blueprint-background',
    'grid-background',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds & Surfaces
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        'surface-secondary': 'hsl(var(--surface-secondary))',
        'surface-elevated': 'hsl(var(--surface-elevated))',
        'surface-overlay': 'hsl(var(--surface-overlay))',

        // Foreground (Text)
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--foreground-secondary))',
          tertiary: 'hsl(var(--foreground-tertiary))',
          muted: 'hsl(var(--foreground-muted))',
        },

        // Borders
        border: {
          DEFAULT: 'hsl(var(--border))',
          strong: 'hsl(var(--border-strong))',
          subtle: 'hsl(var(--border-subtle))',
        },

        // Interactive States
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        // Status Colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },

        // Destructive (legacy support)
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        // Form Elements
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Card
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Grid/Blueprint
        grid: 'hsl(var(--grid-color))',
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },

      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
        loose: 'var(--leading-loose)',
        editorial: 'var(--leading-editorial)',
      },

      letterSpacing: {
        tighter: 'var(--tracking-tighter)',
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
        widest: 'var(--tracking-widest)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-left': {
          from: { transform: 'translateX(10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'grid-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
        orbit: {
          '0%': {
            transform: 'rotate(0deg) translateX(150%) rotate(0deg)',
            opacity: '1',
          },
          '50%': {
            opacity: '0.6',
          },
          '100%': {
            transform: 'rotate(360deg) translateX(150%) rotate(-360deg)',
            opacity: '1',
          },
        },
      },

      animation: {
        'slide-up': 'slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slide-down 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slide-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slide-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-out': 'scale-out 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        shimmer: 'shimmer 2s infinite linear',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'grid-pulse': 'grid-pulse 8s ease-in-out infinite',
        orbit: 'orbit 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
