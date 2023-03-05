/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

declare const process: {
  env: {
    NODE_ENV: "development" | "production";
  };
};

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext {
    env: Env;
  }
}
