import express from 'express';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { practiceUsersRouter } from './learning/routes/practice-users.routes.js';
import { userRouter } from './modules/user/user.routes.js';

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
    message: 'Xin chào ' + name,
  });
});

app.post('/hello', (req, res) => {
  const name = req.body?.name;

  if (typeof name !== 'string') {
    res.status(400).json({
      message: 'Tên phải là một chuỗi ký tự',
    });
    return;
  }

  if (name.trim() === '') {
    res.status(400).json({
      message: 'Tên không được để trống',
    });
    return;
  }

  res.json({
    message: 'Xin chào ' + name.trim(),
  });
});

app.use('/practice-users', practiceUsersRouter);
app.use('/api/v1/users', userRouter);
app.use(errorHandler);
