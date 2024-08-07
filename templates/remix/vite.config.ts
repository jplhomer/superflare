import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { superflareDevProxyVitePlugin } from "@superflare/remix";
import tsconfigPaths from "vite-tsconfig-paths";

import config from "./superflare.config";

export default defineConfig({
  plugins: [
    superflareDevProxyVitePlugin(config),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  ssr: {
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
  },
  build: {
    minify: true,
  },
});
