import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party asset (ClaimFormFiller's pdf-lib UMD build) and the
    // one-off Node conversion script that generates src/data/claim-forms/*.json —
    // neither is part of the app bundle.
    "public/vendor/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
