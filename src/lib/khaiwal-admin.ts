import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getTopGamesDatabase } from "./top-games-mongodb";

const scrypt = promisify(scryptCallback);
const collectionName = "admin_users";

type AdminUser = {
  loginId: string;
  passwordHash: string;
  passwordSalt: string;
  active: boolean;
};

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return { passwordHash: derivedKey.toString("hex"), passwordSalt: salt };
}

export async function verifyKhaiwalAdmin(loginId: string, password: string) {
  if (!loginId || !password) return false;

  const user = await (await getTopGamesDatabase())
    .collection<AdminUser>(collectionName)
    .findOne({ loginId: loginId.trim().toLowerCase(), active: true });

  if (!user?.passwordHash || !user.passwordSalt) return false;

  const suppliedHash = (await scrypt(password, user.passwordSalt, 64)) as Buffer;
  const storedHash = Buffer.from(user.passwordHash, "hex");
  return suppliedHash.length === storedHash.length && timingSafeEqual(suppliedHash, storedHash);
}
