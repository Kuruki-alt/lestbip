/** @type {import('tailwindcss').Config} */
export default {
  // ライト/ダークは class 戦略で実際に切り替える（CLAUDE.md §6 / 要件 §5.2）
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
