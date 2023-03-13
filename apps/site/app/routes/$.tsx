import { MetaFunction } from "@remix-run/react/dist/routeModules";

export { default, loader } from "./index";

export const meta: MetaFunction = ({ data }) => ({
  title: data?.title ? `${data.title} - Superflare` : "Superflare",
  description: data?.description,
});
