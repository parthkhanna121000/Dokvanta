import { compare, hash } from "bcryptjs";
import { AppError } from "../../utils/app-error";
import { UserModel } from "../users/user.model";
import type { AuthConfig } from "./auth.config";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === 11000;
}

// Compared against when the email is unknown, so "no such user" costs the same time as "wrong password".
let dummyHash: Promise<string> | undefined;
function getDummyHash(cost: number): Promise<string> {
  dummyHash ??= hash("dummy-password-for-timing", cost);
  return dummyHash;
}

export async function registerUser(
  config: AuthConfig,
  input: { email: string; password: string; name: string },
): Promise<PublicUser> {
  const passwordHash = await hash(input.password, config.bcryptCost);
  try {
    const user = await UserModel.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    return { id: String(user._id), email: user.email, name: user.name };
  } catch (err) {
    if (isDuplicateKey(err)) {
      throw AppError.conflict("An account with this email already exists");
    }
    throw err;
  }
}

export async function loginUser(
  config: AuthConfig,
  input: { email: string; password: string },
): Promise<PublicUser> {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");
  const matches = await compare(input.password, user ? user.passwordHash : await getDummyHash(config.bcryptCost));
  if (!user || !matches) throw AppError.unauthorized("Invalid email or password");
  return { id: String(user._id), email: user.email, name: user.name };
}