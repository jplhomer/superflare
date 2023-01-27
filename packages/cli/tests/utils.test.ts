import { describe, expect, it } from "vitest";
import {
  addTypesToModelClass,
  SuperflareType,
  SUPERFLARE_TYPES_END_MARKER,
  SUPERFLARE_TYPES_START_MARKER,
} from "../utils";

describe("addTypesToModelClass", () => {
  it("adds types to a model class", () => {
    const source = `export class User extends Model {
}`;
    const modelClass = "User";
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: false },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(`export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  password: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);
  });

  it("takes nullable into account", () => {
    const source = `export class User extends Model {
}`;

    const modelClass = "User";
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: true },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(`export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  password?: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);
  });

  it("replaces existing types if they exist", () => {
    const source = `export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`;

    const modelClass = "User";
    const types: SuperflareType[] = [
      { name: "id", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "email", type: "string", nullable: false },
      { name: "password", type: "string", nullable: false },
    ];

    const result = addTypesToModelClass(source, modelClass, types);

    expect(result).toBe(`export class User extends Model {
  ${SUPERFLARE_TYPES_START_MARKER}
  id: string;
  name: string;
  email: string;
  password: string;
  ${SUPERFLARE_TYPES_END_MARKER}
}`);
  });
});
