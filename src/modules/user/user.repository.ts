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

export async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      deletedAt: true,
    },
  });

  return user;
}

export async function createUser(email: string, passwordHash: string) {
  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      passwordHash: passwordHash,
      status: 'PENDING_VERIFICATION',
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return user;
}

export async function verifyUserEmail(userId: string, email: string) {
  return prisma.user.updateMany({
    where: {
      id: userId,
      email,
      status: 'PENDING_VERIFICATION',
      deletedAt: null,
    },
    data: {
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
}

export async function deletePendingUser(userId: string) {
  return prisma.user.deleteMany({
    where: { id: userId, status: 'PENDING_VERIFICATION', emailVerifiedAt: null },
  });
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DEACTIVATED') {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: status,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return user;
}
