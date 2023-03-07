/**
 * Superflare accepts external implementations of Session which match the following signature:
 */
export interface Session {
  id: string;
  data: any;
  has(key: string): boolean;
  get(key: string): any;
  set(key: string, value: any): void;
  unset(key: string): void;
  flash(key: string, value: any): void;
}

/**
 * Superflare exposes its own Session implementation which includes a dirty tracker to allow
 * it to automatically commit changes to the session as a Cookie header on the outgoing response.
 */
export class SuperflareSession implements Session {
  private dirty = false;

  constructor(private session: Session) {}

  get id() {
    return this.session.id;
  }

  get data() {
    return this.session.data;
  }

  has(key: string) {
    return this.session.has(key);
  }

  get(key: string) {
    return this.session.get(key);
  }

  /**
   * Get a flashed value from the session, and indicate that the session has been modified.
   */
  getFlash(key: string) {
    this.dirty = true;
    return this.session.get(key);
  }

  set(key: string, value: any) {
    this.dirty = true;
    this.session.set(key, value);
  }

  unset(key: string) {
    this.dirty = true;
    this.session.unset(key);
  }

  /**
   * Flash a value to the session. To read the flashed value on a future request, use `getFlash`.
   */
  flash(key: string, value: any) {
    this.dirty = true;
    this.session.flash(key, value);
  }

  isDirty() {
    return this.dirty;
  }

  getSession() {
    return this.session;
  }
}
