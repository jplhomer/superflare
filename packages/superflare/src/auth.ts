import { BaseModel } from "../index.types";
import { hash } from "./hash";
import { Session } from "./session";

const SESSION_KEY = "superflare:auth:id";

export class Auth {
  constructor(public session: Session) {}

  async attempt<M extends BaseModel>(
    model: M,
    credentials: { email: string; password: string }
  ) {
    const user = await model.where("email", credentials.email).first();

    if (!user) return false;

    const passwordMatches = await hash().check(
      credentials.password,
      // @ts-expect-error I don't know how to indicate that we expect a password field
      user.password
    );

    if (!passwordMatches) return false;

    this.login(user);

    return true;
  }

  async check<M extends new (args: any) => InstanceType<M>>(model: M) {
    return !!(await this.user(model));
  }

  id() {
    return this.session.get(SESSION_KEY);
  }

  login(user: any) {
    this.session.set(SESSION_KEY, user.id);
  }

  async user<M extends new (args: any) => InstanceType<M>>(
    model: M
  ): Promise<InstanceType<M> | null> {
    const id = this.id();

    if (!id) return null;

    // @ts-expect-error I do not understand how to make TypeScript happy, and I do not care.
    return await model.find(id);
  }

  logout() {
    this.session.unset(SESSION_KEY);
  }
}
