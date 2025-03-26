module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0, opacity: 0 },
          to: { height: "var(--radix-accordion-content-height)", opacity: 1 },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: 1 },
          to: { height: 0, opacity: 0 },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '50%': { opacity: '0.5', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px) scale(0.98)', opacity: '0' },
          '60%': { transform: 'translateY(-2px) scale(1.01)', opacity: '0.8' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.98)'
          },
          '60%': {
            opacity: '0.8',
            transform: 'translateY(-5px) scale(1.02)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          },
        },
        'content-enter': {
          '0%': {
            opacity: '0',
            transform: 'translateY(1rem) scale(0.96)'
          },
          '60%': {
            opacity: '0.8',
            transform: 'translateY(-0.2rem) scale(1.01)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          },
        },
        'floating': {
          '0%, 100%': {
            transform: 'translateY(0) scale(1)',
            filter: 'drop-shadow(0 5px 15px rgba(0, 0, 0, 0.1))'
          },
          '50%': {
            transform: 'translateY(-10px) scale(1.01)',
            filter: 'drop-shadow(0 15px 20px rgba(0, 0, 0, 0.15))'
          },
        },
        'spring-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(100%) scale(0.96) rotateY(10deg)'
          },
          '40%': {
            opacity: '0.6',
            transform: 'translateX(-10%) scale(1.03) rotateY(-3deg)'
          },
          '70%': {
            opacity: '0.8',
            transform: 'translateX(3%) scale(1.01) rotateY(1deg)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0) scale(1) rotateY(0)'
          },
        },
        'spring-in-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-100%) scale(0.96) rotateY(-10deg)'
          },
          '40%': {
            opacity: '0.6',
            transform: 'translateX(10%) scale(1.03) rotateY(3deg)'
          },
          '70%': {
            opacity: '0.8',
            transform: 'translateX(-3%) scale(1.01) rotateY(-1deg)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0) scale(1) rotateY(0)'
          },
        },
        'spring-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(100%) scale(0.96) rotateX(10deg)'
          },
          '40%': {
            opacity: '0.6',
            transform: 'translateY(-10%) scale(1.03) rotateX(-3deg)'
          },
          '70%': {
            opacity: '0.8',
            transform: 'translateY(3%) scale(1.01) rotateX(1deg)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1) rotateX(0)'
          },
        },
        'spring-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-100%) scale(0.96) rotateX(-10deg)'
          },
          '40%': {
            opacity: '0.6',
            transform: 'translateY(10%) scale(1.03) rotateX(3deg)'
          },
          '70%': {
            opacity: '0.8',
            transform: 'translateY(-3%) scale(1.01) rotateX(-1deg)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1) rotateX(0)'
          },
        },
        'pulse-shadow': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.15)'
          },
          '50%': {
            transform: 'scale(1.01)',
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 12px 20px -8px rgba(0, 0, 0, 0.2)'
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "accordion-up": "accordion-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fadeIn": 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        "slideUp": 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'content-enter': 'content-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'floating': 'floating 3s ease-in-out infinite',
        'spring-in-right': 'spring-in-right 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spring-in-left': 'spring-in-left 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spring-in-up': 'spring-in-up 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spring-in-down': 'spring-in-down 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-shadow': 'pulse-shadow 2s ease-in-out infinite',
        'floating': 'floating 3s ease-in-out infinite',
        'spring-in-right': 'spring-in-right 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spring-in-left': 'spring-in-left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spring-in-up': 'spring-in-up 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spring-in-down': 'spring-in-down 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'

    },
  },
},
}