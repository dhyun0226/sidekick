import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default <Partial<Config>>{
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
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Noto Serif KR', 'serif'],
            },
            minHeight: {
                'touch': '44px',
            },
            minWidth: {
                'touch': '44px',
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
