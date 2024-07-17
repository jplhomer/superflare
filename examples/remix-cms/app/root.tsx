import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import styles from "./tailwind.css?url";
import syntax from "./styles/syntax.css?url";

export const meta: MetaFunction = () => [
  { charset: "utf-8" },
  { title: "Remix CMS" },
  { viewport: "width=device-width,initial-scale=1" },
];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "stylesheet", href: syntax },
];

export default function App() {
  return (
    <html lang="en" className="h-full bg-gray-100 dark:bg-black">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="dark:text-gray-100 h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
