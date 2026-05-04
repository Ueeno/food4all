import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".dart_tool/**",
    "android/**",
    "build/**",
    "components/food4all_flutter/**",
    "ios/**",
    "linux/**",
    "macos/**",
    "next-env.d.ts",
    "lib/generated/**",
    "out/**",
    "web/**",
    "windows/**",
  ]),
])
