import { seed } from "superflare";
import { UserFactory } from "./factories/UserFactory";

export default seed(async () => {
  await UserFactory.create();
});
