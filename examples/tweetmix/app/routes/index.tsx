import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { Tweet } from "~/models/Tweet";

export async function loader() {
  const tweets = await Tweet.all();

  return json({
    tweets,
  });
}

export default function Index() {
  const { tweets } = useLoaderData<typeof loader>();
  console.log({ tweets });
  return <h1>Index</h1>;
}
