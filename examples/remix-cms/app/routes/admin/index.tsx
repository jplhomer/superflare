import { Page } from "~/components/admin/Page";

export async function loader({ context }) {
  await context.QUEUE.send({
    foo: "bar",
  });

  return null;
}

export default function () {
  return <Page title="Dashboard">Hello, world</Page>;
}
