import {
  createUser,
  deletePendingUser,
  findProfileById,
  findUserByEmail,
  verifyUserEmail,
} from '../user/user.repository.js';
import { sendVerificationEmail } from '../notification/mail.service.js';
import { hashPassword, verifyPassword } from './password.service.js';
import {
  createAccessToken,
  createEmailVerificationToken,
  createRefreshToken,
  verifyEmailVerificationToken,
  verifyRefreshToken,
} from './token.service.js';

export async function registerUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) return null;

  const passwordHash = await hashPassword(password);
  const user = await createUser(normalizedEmail, passwordHash);

  try {
    const token = await createEmailVerificationToken(user.id, user.email);
    await sendVerificationEmail(user.email, token);
  } catch (error) {
    await deletePendingUser(user.id);
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function verifyEmail(token: string): Promise<boolean> {
  const tokenData = await verifyEmailVerificationToken(token);
  if (!tokenData) return false;

  const user = await findProfileById(tokenData.userId);
  if (!user || user.email !== tokenData.email || user.deletedAt !== null) return false;
  if (user.status === 'ACTIVE') return user.emailVerifiedAt !== null;
  if (user.status !== 'PENDING_VERIFICATION') return false;

  const result = await verifyUserEmail(user.id, user.email);
  return result.count === 1;
}

export async function resendVerificationEmail(email: string, password: string): Promise<boolean> {
  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user || user.deletedAt !== null || user.status !== 'PENDING_VERIFICATION') return false;
  if (!await verifyPassword(password, user.passwordHash)) return false;

  const token = await createEmailVerificationToken(user.id, user.email);
  await sendVerificationEmail(user.email, token);
  return true;
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user || user.deletedAt !== null) return null;
  if (!await verifyPassword(password, user.passwordHash)) return null;
  if (user.status !== 'ACTIVE' || user.emailVerifiedAt === null) return null;

  const accessToken = await createAccessToken(user.id, user.email, user.role);
  const refreshToken = await createRefreshToken(user.id);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) return null;

  const user = await findProfileById(userId);
  if (!user || user.deletedAt !== null || user.status !== 'ACTIVE' || user.emailVerifiedAt === null) {
    return null;
  }

  return createAccessToken(user.id, user.email, user.role);
}
