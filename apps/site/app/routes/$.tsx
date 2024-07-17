import { MetaFunction } from "@remix-run/react/dist/routeModules";

import { loader as indexLoader } from "./index";

export { default } from "./index";

export const loader = indexLoader;

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data?.title ? `${data.title} - Superflare` : "Superflare",
  },
  {
    "twitter:title": data?.title ? `${data.title} - Superflare` : "Superflare",
  },
  { description: data?.description, "twitter:description": data?.description },
];
