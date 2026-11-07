export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
  /** true: keep the session across browser restarts; false: this tab only. */
  remember: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}
