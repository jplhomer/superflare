import { Schema } from "superflare";

export default function () {
  return Schema.create("users", (table) => {
    table.increments("id");
    table.string("email").unique();
    table.string("password");
    table.timestamps();
  });
}
