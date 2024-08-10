import { type Request } from "@cloudflare/workers-types";
import {
  type AppLoadContext,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import { defineConfig, SuperflareAuth, SuperflareSession } from "superflare";
import { type PlatformProxy } from "wrangler";

// When using `wrangler.toml` to configure bindings,
// `wrangler types` will generate types for those bindings
// into the global `Env` interface.
// Need this empty interface so that typechecking passes
// even if no `wrangler.toml` exists.
interface Env {
  APP_KEY: string;
}

// NOTE: PlatformProxy’s caches property is incompatible with the caches global
// https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/api/integrations/platform/caches.ts
type Cloudflare = Omit<PlatformProxy<Env>, "dispose" | "caches" | "cf"> & {
  caches: CacheStorage;
  cf: Request["cf"];
};

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
    auth: InstanceType<typeof SuperflareAuth>;
    session: InstanceType<typeof SuperflareSession>;
  }
}

// Shared implementation compatible with Vite, Wrangler, and Workers
export const getLoadContext = async (
  config: ReturnType<typeof defineConfig<Env>>,
  ctx: ExecutionContext,
  {
    request,
    context,
  }: {
    request: Request;
    context: { cloudflare: Cloudflare };
  }
): Promise<AppLoadContext> => {
  const { env } = context.cloudflare;
  config({ request, env, ctx });
  if (!env.APP_KEY) {
    throw new Error(
      "APP_KEY is required. Please ensure you have defined it as an environment variable."
    );
  }

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      path: "/",
      secure: /^(http|ws)s:\/\//.test(request.url),
      secrets: [env.APP_KEY],
    },
  });

  const session = new SuperflareSession(
    await sessionStorage.getSession(request.headers.get("Cookie"))
  );

  /**
   * We inject auth and session into the Remix load context.
   * Someday, we could replace this with AsyncLocalStorage.
   */
  return {
    ...context,
    session,
    auth: new SuperflareAuth(session),
  };
};
