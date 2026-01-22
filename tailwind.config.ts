const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#05070a",
          purple: "#ff7a3d",
          pink: "#f1b75d",
          cobalt: "#0b1220",
          mint: "#a4e8cf",
          cyan: "#2bb6ad",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "float 10s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
      },
      boxShadow: {
        "glow-purple": "0 0 40px rgba(255, 122, 61, 0.25)",
      },
    },
  },
}

export default config
