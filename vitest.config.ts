import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const sharedSrc = fileURLToPath(new URL("./packages/shared/src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@rupakarsa/shared/ui",
        replacement: fileURLToPath(
          new URL("./packages/shared/src/components/ui/index.ts", import.meta.url),
        ),
      },
      {
        find: "@rupakarsa/shared/brand",
        replacement: fileURLToPath(
          new URL("./packages/shared/src/components/brand/index.ts", import.meta.url),
        ),
      },
      { find: "@rupakarsa/shared", replacement: sharedSrc },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["Testing/Shared/**/*.test.{ts,tsx}"],
  },
});
