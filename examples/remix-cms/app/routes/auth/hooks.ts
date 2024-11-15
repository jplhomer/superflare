import { useRouteLoaderData } from "@remix-run/react";

import { loader as adminLoader } from "../admin";

export function useAdmin() {
  return useRouteLoaderData<typeof adminLoader>("routes/admin");
}
