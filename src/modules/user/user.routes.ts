import { Router } from 'express';
import { authenticationMiddleware } from '../../middlewares/authentication.middleware.js';
import { getMyProfile } from './user.service.js';

export const userRouter = Router();

userRouter.get('/me', authenticationMiddleware, async (_req, res) => {
  const userId = res.locals.authUserId;

  if (typeof userId !== 'string') {
    res.status(401).json({
      message: 'Unable to identify the authenticated user',
    });
    return;
  }

  const profile = await getMyProfile(userId);

  if (profile === null) {
    res.status(401).json({
      message: 'Account is no longer available',
    });
    return;
  }

  res.json(profile);
});
