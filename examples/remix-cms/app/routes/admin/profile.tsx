import { Form } from "@remix-run/react";
import { Page } from "~/components/admin/Page";
import { useAdmin } from "../auth/hooks";

export default function Profile() {
  const adminData = useAdmin();

  return (
    <Page title="Your Profile">
      <h2>Your name is {adminData?.user?.name}</h2>
      <Form method="post" action="/auth/logout">
        <button type="submit">Log out</button>
      </Form>
    </Page>
  );
}
