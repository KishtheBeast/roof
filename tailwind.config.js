/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    gold: '#C9A227',
                    navy: '#1A1A2E',
                    'green-dark': '#1A5C3A',
                    'green-light': '#ECFDF5',
                    beige: '#F5F2EB',
                    charcoal: '#0A0A0A',
                }
            },
            fontFamily: {
                serif: ['Fraunces', 'serif'],
                sans: ['DM Sans', 'sans-serif'],
                mono: ['Space Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
