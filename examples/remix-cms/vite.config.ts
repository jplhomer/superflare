import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";
import { superflareDevProxyVitePlugin } from "@superflare/remix-dev";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    superflareDevProxyVitePlugin<Env>(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
      // Tell Remix to ignore everything in the routes directory.
      // We’ll let createRoutesFromFolders take care of that.
      ignoredRouteFiles: ["**/*"],
      routes: async (defineRoutes) => {
        // createRoutesFromFolders will create routes for all files in the
        // routes directory using the same default conventions as Remix v1.
        return createRoutesFromFolders(defineRoutes, {
          ignoredFilePatterns: ["**/.*"],
        });
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
