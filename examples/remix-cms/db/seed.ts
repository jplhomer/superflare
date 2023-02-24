import { seed } from "superflare";
import { User } from "../app/models/User";

export default seed(() => {
  User.create({
    name: "John Doe",
    email: "dev@example.com",
    // TODO: Inline hashed password
    password: "password",
  });
});
