import { defineConfig } from "vite";
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin,
} from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

export default defineConfig({
  plugins: [
    cloudflareDevProxyVitePlugin(),
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
