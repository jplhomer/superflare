import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/admin/Button";
import { Page } from "~/components/admin/Page";
import { Article } from "~/models/Article";

export async function loader() {
  const articles = await Article.all();

  return json({ articles });
}

export default function Articles() {
  const { articles } = useLoaderData<typeof loader>();

  const ArticlesTable = (
    <div className="mt-8 flow-root">
      <div className="-my-2 -mx-6 overflow-x-auto lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-3 pl-6 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300 sm:pl-0"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Created At
                </th>
                <th scope="col" className="relative py-3 pl-3 pr-6 sm:pr-0">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:bg-black">
              {articles.map((article) => (
                <tr key={article.slug}>
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-0">
                    {article.title}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 dark:text-gray-300">
                    {article.status}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 dark:text-gray-300">
                    {article.user_id}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 dark:text-gray-300">
                    {article.created_at}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium sm:pr-0">
                    <Link
                      to={`./${article.slug}`}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                    >
                      Edit<span className="sr-only">, {article.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  return (
    <Page title="Articles" action={<Button to="./new">Create Article</Button>}>
      {articles.length ? ArticlesTable : <p>No articles yet. Create one!</p>}
    </Page>
  );
}
