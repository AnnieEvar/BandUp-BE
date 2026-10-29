import { Router } from 'express';
import type {
  CreatePracticeUserInput,
  UpdatePracticeUserInput,
} from '../dtos/practice-user.dto.js';
import {
  createPracticeUser,
  deletePracticeUser,
  findAllPracticeUsers,
  findPracticeUserById,
  updatePracticeUser,
} from '../services/practice-users.service.js';

function parseId(value: string | undefined): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function parseName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const name = value.trim();

  if (name === '' || name.length > 100) {
    return null;
  }

  return name;
}

export const practiceUsersRouter = Router();

practiceUsersRouter.get('/', async (_req, res) => {
  const users = await findAllPracticeUsers();

  res.json(users);
});

practiceUsersRouter.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: 'Invalid ID',
    });
    return;
  }

  const user = await findPracticeUserById(id);

  if (user === null) {
    res.status(404).json({
      message: 'User not found',
    });
    return;
  }

  res.json(user);
});

practiceUsersRouter.post('/', async (req, res) => {
  const name = parseName(req.body?.name);

  if (name === null) {
    res.status(400).json({
      message: 'Invalid name',
    });
    return;
  }

  const input: CreatePracticeUserInput = {
    name: name,
  };

  const user = await createPracticeUser(input);

  res.status(201).json(user);
});

practiceUsersRouter.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const name = parseName(req.body?.name);

  if (id === null) {
    res.status(400).json({
      message: 'Invalid ID',
    });
    return;
  }

  if (name === null) {
    res.status(400).json({
      message: 'Invalid name',
    });
    return;
  }

  const input: UpdatePracticeUserInput = {
    id: id,
    name: name,
  };

  const updatedUser = await updatePracticeUser(input);

  if (updatedUser === null) {
    res.status(404).json({
      message: 'User not found',
    });
    return;
  }

  res.json(updatedUser);
});

practiceUsersRouter.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: 'Invalid ID',
    });
    return;
  }

  const deletedUser = await deletePracticeUser(id);

  if (deletedUser === null) {
    res.status(404).json({
      message: 'User not found',
    });
    return;
  }

  res.status(204).send();
});
