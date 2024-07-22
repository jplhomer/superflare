/// <reference types="@cloudflare/workers-types" />

declare module "__STATIC_CONTENT_MANIFEST" {
  const manifest: string;
  export default manifest;
}

declare const process: {
  env: {
    NODE_ENV: "development" | "production";
  };
};
