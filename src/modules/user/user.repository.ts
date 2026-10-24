import { prisma } from '../../prisma.js';

export async function findProfileById(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
