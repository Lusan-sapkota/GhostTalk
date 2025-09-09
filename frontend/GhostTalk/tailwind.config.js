/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyan: "#00CFFF",
        purple: "#5B47FF",
        magenta: "#FF5EC4",
        violet: "#B384FF",
        paleCyan: "#78EEF4",
      },
      backgroundImage: {
        'gradient-cyan-pink-violet': 'linear-gradient(90deg, #00CFFF, #FF5EC4, #B384FF)',
      },
    },
  },
  presets: [require('nativewind/preset')],
}
