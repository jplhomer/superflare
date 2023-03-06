import { useMatches } from "@remix-run/react";

export function useAdmin() {
  return useMatches().find((match) => match.id === "routes/admin")!.data;
}
