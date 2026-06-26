import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/**"]),
  {
    rules: {
      // Syncing local state from props (modal drafts, controlled inputs) is intentional.
      "react-hooks/set-state-in-effect": "off",
      // Ref forwarding via createElement / callback refs is valid in this codebase.
      "react-hooks/refs": "off",
      // PDF row counters are render-local, not React state.
      "react-hooks/immutability": "off",
      // Logos and module assets use dynamic / blob / API URLs — plain img is intentional.
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
