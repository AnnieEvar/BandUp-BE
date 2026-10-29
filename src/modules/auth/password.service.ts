import * as argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  const passwordHash = await argon2.hash(password);

  return passwordHash;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const matches = await argon2.verify(passwordHash, password);

  return matches;
}
