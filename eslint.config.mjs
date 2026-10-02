import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  {
    ignores: [".next/**", "node_modules/**", "public/uploads/**"],
    rules: {
      "@next/next/no-img-element": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
];
