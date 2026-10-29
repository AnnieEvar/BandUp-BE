import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  const isInvalidJson =
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400;

  if (isInvalidJson) {
    res.status(400).json({
      message: 'Invalid JSON',
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    message: 'An internal server error occurred',
  });
};
