module.exports = {
  mode: "jit",
  content: ["./src/**/*.{html,js,svelte,ts}"],
  variants: {
    extend: {
      visibility: ["group-hover"],
    },
  },
  theme: {
    extend: {
      colors: {
        pct: "rgb(0, 110, 118)",
      },
      width: {
        "1/7": "14.2857143%",
        "1/8": "12.5%",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
