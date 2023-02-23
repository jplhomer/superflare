import { Link } from "@remix-run/react";
import Button from "~/components/admin/Button";
import { Page } from "~/components/admin/Page";

export default function Articles() {
  const ArticlesTable = (
    <div className="mt-8 flow-root">
      <div className="-my-2 -mx-6 overflow-x-auto lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-3 pl-6 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-0"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Role
                </th>
                <th scope="col" className="relative py-3 pl-3 pr-6 sm:pr-0">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {[].map((person) => (
                <tr key={person.email}>
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                    {person.name}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {person.title}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {person.email}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {person.role}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium sm:pr-0">
                    <Link
                      to={`./articles/${person.slug}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit<span className="sr-only">, {person.name}</span>
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
      {[].length ? ArticlesTable : <p>No articles yet. Create one!</p>}
    </Page>
  );
}
