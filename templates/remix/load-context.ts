import { type Cloudflare } from "@superflare/remix";

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare<Env>;
  }
}
