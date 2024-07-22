import { defineConfig } from "tsup";

const nodejsCompatPlugin: any = {
  name: "nodejs_compat Plugin",
  setup(pluginBuild: any) {
    pluginBuild.onResolve({ filter: /node:.*/ }, (opts: any) => {
      return { external: true };
    });
  },
};

export default defineConfig([
  {
    format: ["esm", "cjs"],
    esbuildPlugins: [nodejsCompatPlugin],
    entry: ["index.ts", "cli.ts"],
    external: ["@miniflare/storage-redis", "ioredis"],
  },
  {
    entry: ["index.types.ts"],
    dts: {
      only: true,
    },
  },
]);
