import { expect, it } from "vitest";
import { modelToTableName } from "../string";

it("generates the table name from the model name", () => {
  expect(modelToTableName("Post")).toBe("posts");
  expect(modelToTableName("User")).toBe("users");
  expect(modelToTableName("UserPost")).toBe("user_posts");
  expect(modelToTableName("Person")).toBe("people");
});
