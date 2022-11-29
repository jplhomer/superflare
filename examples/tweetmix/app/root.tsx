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
import { Layout } from "./components/Layout";
import { getUserId, logout } from "./lib/session.server";
import { User } from "./models/user.server";
import { config } from "superflare";
import styles from "./tailwind.css";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Tweetmix",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request, context }: LoaderArgs) {
  config({ database: context.DB });
  const userId = await getUserId(request);

  try {
    const user = userId ? await User.find(userId, context) : null;

    return json({
      user,
    });
  } catch (error) {
    throw await logout(request);
  }
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="dark:text-gray-100 dark:bg-black">
        <Layout user={user}>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
