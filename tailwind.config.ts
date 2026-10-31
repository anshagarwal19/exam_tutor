import type { Config } from "tailwindcss";

// Colours point at CSS variables (see app/globals.css), so light and night mode
// switch by toggling the `dark` class on <html>. Use these names in components.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: v("paper"),
        surface: v("surface"),
        ink: v("ink"),
        graphite: v("graphite"),
        rule: v("rule"),
        accent: v("accent"),
        ember: v("ember"),
        moss: v("moss"),
        amber: v("amber"),
        rust: v("rust"),
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        hand: ["var(--font-hand)", "cursive"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
