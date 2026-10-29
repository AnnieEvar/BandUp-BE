import express from 'express';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { practiceUsersRouter } from './learning/routes/practice-users.routes.js';
import { userRouter } from './modules/user/user.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';

export const app = express();


app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'BandUp API is running',
  });
});

app.get('/hello/:name', (req, res) => {
  const name = req.params.name;

  res.json({
    message: 'Hello ' + name,
  });
});

app.post('/hello', (req, res) => {
  const name = req.body?.name;

  if (typeof name !== 'string') {
    res.status(400).json({
      message: 'Name must be a string',
    });
    return;
  }

  if (name.trim() === '') {
    res.status(400).json({
      message: 'Name must not be empty',
    });
    return;
  }

  res.json({
    message: 'Hello ' + name.trim(),
  });
});

app.use('/practice-users', practiceUsersRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use(errorHandler);
