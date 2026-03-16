import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-plugin-import is optional — gracefully skip if not installed yet.
let importPlugin = null;
try {
  importPlugin = (await import("eslint-plugin-import")).default;
} catch {
  // Run `npm install` to enable import safety rules.
}

const importRules = importPlugin
  ? [
      {
        plugins: { import: importPlugin },
        rules: {
          // Fail if a named import doesn't exist in the target module
          "import/named": "error",
          // Warn on circular dependencies
          "import/no-cycle": "warn",
          // Encourage named exports — Next.js pages/routes are exempt (they require default)
          "import/no-default-export": "warn",
        },
        // Exempt Next.js special files from the no-default-export rule
        overrides: [
          {
            files: [
              "app/**/page.tsx",
              "app/**/layout.tsx",
              "app/**/route.ts",
              "app/**/loading.tsx",
              "app/**/error.tsx",
              "app/**/not-found.tsx",
              "next.config.*",
              "tailwind.config.*",
            ],
            rules: {
              "import/no-default-export": "off",
            },
          },
        ],
      },
    ]
  : [];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...importRules,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".scripts-out/**",
  ]),
]);

export default eslintConfig;
