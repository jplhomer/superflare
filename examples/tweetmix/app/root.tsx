import type {
  LinksFunction,
  MetaFunction,
  LoaderArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { config } from "superflare";
import styles from "./tailwind.css";
import { Tweet } from "../tweet";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Tweetmix",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="dark:text-gray-100 dark:bg-black">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
