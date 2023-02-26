import { seed } from "superflare";
import { User } from "~/models/User";

export default seed(() => {
  User.factory().create();
  // User.create({
  //   name: "John Doe",
  //   email: "dev@example.com",
  //   // TODO: Inline hashed password
  //   password: "password",
  // });
});
