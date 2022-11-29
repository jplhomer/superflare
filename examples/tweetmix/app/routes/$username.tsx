import { Outlet, useParams } from "@remix-run/react";
import { Heading } from "~/components/Text";

export default function Username() {
  const { username } = useParams();

  return (
    <div className="relative pt-16">
      <Heading>@{username}</Heading>
      <Outlet />
    </div>
  );
}
