import { Schema } from "superflare";

export default function () {
  return Schema.create("users", (table) => {
    table.increments("id");
    table.string("name").nullable();
    table.string("email").unique();
    table.string("password");
    table.timestamps();
  });
}
