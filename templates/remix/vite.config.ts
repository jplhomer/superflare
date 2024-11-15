import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { superflareDevProxyVitePlugin } from "@superflare/remix/dev";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    superflareDevProxyVitePlugin<Env>(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_lazyRouteDiscovery: true,
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
});
