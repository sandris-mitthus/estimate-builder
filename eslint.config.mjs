import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/**"]),
  {
    rules: {
      // Calling setState synchronously in effects is a legitimate pattern
      // for syncing state from props (controlled inputs, modal resets, etc.).
      "react-hooks/set-state-in-effect": "warn",
      // Updating ref.current during render is valid for stable callback refs.
      "react-hooks/refs": "warn",
      // Local counter variables in PDF render functions are not React state.
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
