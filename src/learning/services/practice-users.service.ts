import type {
  CreatePracticeUserInput,
  UpdatePracticeUserInput,
} from '../dtos/practice-user.dto.js';
import { prisma } from '../../prisma.js';

export async function findAllPracticeUsers() {
  const users = await prisma.practiceUser.findMany({
    orderBy: {
      id: 'asc',
    },
  });

  return users;
}

export async function findPracticeUserById(id: number) {
  const user = await prisma.practiceUser.findUnique({
    where: {
      id: id,
    },
  });

  return user;
}

export async function createPracticeUser(input: CreatePracticeUserInput) {
  const user = await prisma.practiceUser.create({
    data: {
      name: input.name,
    },
  });

  return user;
}

export async function updatePracticeUser(input: UpdatePracticeUserInput) {
  const existingUser = await findPracticeUserById(input.id);

  if (existingUser === null) {
    return null;
  }

  const updatedUser = await prisma.practiceUser.update({
    where: {
      id: input.id,
    },
    data: {
      name: input.name,
    },
  });

  return updatedUser;
}

export async function deletePracticeUser(id: number) {
  const existingUser = await findPracticeUserById(id);

  if (existingUser === null) {
    return null;
  }

  const deletedUser = await prisma.practiceUser.delete({
    where: {
      id: id,
    },
  });

  return deletedUser;
}
