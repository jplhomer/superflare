import { Model } from "superflare";

export class User extends Model {
  toJSON(): Omit<UserRow, "password"> {
    const { password, ...rest } = super.toJSON();
    return rest;
  }
}

Model.register(User);

/* superflare-types-start */
interface UserRow {
  id: number;
  name?: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends UserRow {}
/* superflare-types-end */
