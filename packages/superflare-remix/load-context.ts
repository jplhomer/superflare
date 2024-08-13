import { type Request } from "@cloudflare/workers-types";
import {
  type AppLoadContext,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import {
  SuperflareAuth,
  SuperflareSession,
  type DefineConfigReturn,
} from "superflare";
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
export type Cloudflare = Omit<
  PlatformProxy<Env>,
  "dispose" | "caches" | "cf"
> & {
  caches: CacheStorage;
  cf: Request["cf"];
};

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
    auth: InstanceType<typeof SuperflareAuth>;
    session: InstanceType<typeof SuperflareSession>;
    getSessionCookie: () => Promise<string>;
  }
}

// Shared implementation compatible with Vite, Wrangler, and Workers
export const getLoadContext = async (payload: {
  request: Request;
  context: { cloudflare: Cloudflare };
  SuperflareAuth: typeof SuperflareAuth;
  SuperflareSession: typeof SuperflareSession;
}): Promise<AppLoadContext> => {
  const { request, context } = payload;
  const { env } = context.cloudflare;
  if (!env.APP_KEY) {
    throw new Error(
      "APP_KEY is required. Please ensure you have defined it as an environment variable."
    );
  }

  const { getSession, commitSession } = createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      path: "/",
      secure: /^(http|ws)s:\/\//.test(request.url),
      secrets: [env.APP_KEY],
    },
  });

  const session = new payload.SuperflareSession(
    await getSession(request.headers.get("Cookie"))
  );

  // Ensure we have a sessionId here (instead of in superflare#handleFetch)
  if (!session.has("sessionId")) {
    session.set("sessionId", crypto.randomUUID());
  }

  /**
   * We inject auth and session into the Remix load context.
   * Someday, we could replace this with AsyncLocalStorage.
   */
  return {
    ...context,
    session,
    auth: new payload.SuperflareAuth(session),
    getSessionCookie: () => commitSession(session.getSession()),
  };
};
