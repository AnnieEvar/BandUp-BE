import { UserStatus } from '../../generated/prisma/enums.js';
import type { UserProfileDto } from './dto/user-profile.dto.js';
import { findProfileById } from './user.repository.js';

export async function getMyProfile(
  userId: string,
): Promise<UserProfileDto | null> {
  const user = await findProfileById(userId);

  if (
    user === null ||
    user.deletedAt !== null ||
    user.status !== UserStatus.ACTIVE
  ) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
