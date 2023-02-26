import { Factory } from "superflare";
import { User } from "~/models/User";
import { faker } from "@faker-js/faker";

export const UserFactory = Factory.for(User).definition(() => ({
  name: faker.name.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
}));
