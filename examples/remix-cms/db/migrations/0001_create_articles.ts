import { Schema } from "superflare";

export default function () {
  return Schema.create("articles", (table) => {
    table.increments("id");
    table.string("title");
    table.string("slug").unique();
    table.text("content").nullable();
    table.integer("userId");
    table.string("status");
    table.timestamps();
  });
}
