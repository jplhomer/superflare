import {
  json,
  type LinksFunction,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import styles from "./styles/tailwind.css?url";
import "focus-visible";

export const meta: MetaFunction = () => [
  { charset: "utf-8" },
  { title: "Superflare", "twitter:title": "Superflare" },
  { viewport: "width=device-width,initial-scale=1" },
  {
    description:
      "Superflare is a full-stack toolkit for building applications on Cloudflare Workers.",
  },
  {
    "twitter:description":
      "Superflare is a full-stack toolkit for building applications on Cloudflare Workers.",
  },
  { "twitter:card": "summary_large_image" },
  { "twitter:creator": "@jplhomer" },
  { "og:type": "website" },
  { "og:image": "https://superflare.dev/superflare-og.jpg" },
  { "twitter:image": "https://superflare.dev/superflare-og.jpg" },
];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Kanit:wght@400&display=swap",
  },
  {
    rel: "icon",
    href: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎸</text></svg>",
  },
];

export async function loader({ context: { cloudflare } }: LoaderFunctionArgs) {
  return json({
    ENV: {
      DOCSEARCH_APP_ID: cloudflare.env.DOCSEARCH_APP_ID,
      DOCSEARCH_API_KEY: cloudflare.env.DOCSEARCH_API_KEY,
      DOCSEARCH_INDEX_NAME: cloudflare.env.DOCSEARCH_INDEX_NAME,
    },
  });
}

const themeScript = `
  let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)')

  function updateTheme(theme) {
    theme = theme ?? window.localStorage.theme ?? 'system'

    if (theme === 'dark' || (theme === 'system' && isDarkMode.matches)) {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light' || (theme === 'system' && !isDarkMode.matches)) {
      document.documentElement.classList.remove('dark')
    }

    return theme
  }

  function updateThemeWithoutTransitions(theme) {
    updateTheme(theme)
    document.documentElement.classList.add('[&_*]:!transition-none')
    window.setTimeout(() => {
      document.documentElement.classList.remove('[&_*]:!transition-none')
    }, 0)
  }

  document.documentElement.setAttribute('data-theme', updateTheme())

  new MutationObserver(([{ oldValue }]) => {
    let newValue = document.documentElement.getAttribute('data-theme')
    if (newValue !== oldValue) {
      try {
        window.localStorage.setItem('theme', newValue)
      } catch {}
      updateThemeWithoutTransitions(newValue)
    }
  }).observe(document.documentElement, { attributeFilter: ['data-theme'], attributeOldValue: true })

  isDarkMode.addEventListener('change', () => updateThemeWithoutTransitions())
`;

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="en" className="antialiased [font-feature-settings:'ss01']">
      <head>
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-white dark:bg-slate-900">
        <Outlet />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
