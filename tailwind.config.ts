import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default <Partial<Config>>{
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Custom Semantic Colors
                background: '#09090b', // Zinc-950
                surface: '#18181b',    // Zinc-900
                accent: '#a3e635',     // Lime-400
                'text-main': '#f4f4f5', // Zinc-100
                'text-sub': '#a1a1aa',  // Zinc-400
                border: '#27272a',      // Zinc-800

                // Keep original palette access if needed
                gray: colors.zinc,
                lime: colors.lime,

                // Apple-style glass colors
                'glass-light': 'rgba(255, 255, 255, 0.72)',
                'glass-dark': 'rgba(24, 24, 27, 0.72)',
                'separator-light': 'rgba(0, 0, 0, 0.08)',
                'separator-dark': 'rgba(255, 255, 255, 0.08)',
            },
            fontFamily: {
                sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
            },
            minHeight: {
                'touch': '44px',
            },
            minWidth: {
                'touch': '44px',
            },
            boxShadow: {
                'apple-sm': '0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
                'apple': '0 0 0 0.5px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.08)',
                'apple-lg': '0 0 0 0.5px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.12)',
            },
            fontSize: {
                'desktop-title': ['32px', { lineHeight: '40px', fontWeight: '700' }],
                'desktop-headline': ['26px', { lineHeight: '34px', fontWeight: '700' }],
                'desktop-body': ['17px', { lineHeight: '28px', fontWeight: '400' }],
                'desktop-callout': ['15px', { lineHeight: '22px', fontWeight: '600' }],
                'desktop-caption': ['13px', { lineHeight: '18px', fontWeight: '500' }],
            },
            spacing: {
                'sidebar': '240px',
                'right-panel': '320px',
            },
            transitionTimingFunction: {
                'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        }
    }
}
