import { Router, type CookieOptions } from 'express';
import {
  loginUser,
  refreshAccessToken,
  registerUser,
  resendVerificationEmail,
  verifyEmail,
} from './auth.service.js';

export const authRouter = Router();

const refreshCookieName = 'bandup_refresh';
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
};
const refreshCookieMaxAge = 7 * 24 * 60 * 60 * 1000;

function getRefreshToken(cookieHeader: string | undefined): string | null {
  const prefix = `${refreshCookieName}=`;
  const cookie = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie?.slice(prefix.length) || null;
}

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    res.status(400).json({
      message: 'A valid email and a password of at least 8 characters are required',
    });
    return;
  }

  const user = await registerUser(email, password);
  if (user === null) {
    res.status(409).json({ message: 'A user with this email already exists' });
    return;
  }

  res.status(201).json(user);
});

authRouter.get('/verify-email', async (req, res) => {
  const token = req.query.token;
  if (typeof token !== 'string' || token === '') {
    res.status(400).json({ message: 'Verification token is required' });
    return;
  }

  const verified = await verifyEmail(token);
  if (!verified) {
    res.status(400).json({ message: 'Verification link is invalid or has expired' });
    return;
  }

  res.json({ message: 'Email verified successfully' });
});

authRouter.post('/resend-verification', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const sent = await resendVerificationEmail(email, password);
  if (!sent) {
    res.status(401).json({ message: 'Invalid email or password, or account is already verified' });
    return;
  }

  res.json({ message: 'Verification email sent' });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const loginResult = await loginUser(email, password);
  if (loginResult === null) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const { refreshToken, ...responseBody } = loginResult;
  res.cookie(refreshCookieName, refreshToken, {
    ...refreshCookieOptions,
    maxAge: refreshCookieMaxAge,
  });
  res.set('Cache-Control', 'no-store').json(responseBody);
});

authRouter.post('/refresh', async (req, res) => {
  const refreshToken = getRefreshToken(req.get('cookie'));
  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token is missing' });
    return;
  }

  const accessToken = await refreshAccessToken(refreshToken);
  if (!accessToken) {
    res.status(401).json({ message: 'Refresh token is invalid or has expired' });
    return;
  }

  res.set('Cache-Control', 'no-store').json({ accessToken });
});

authRouter.post('/logout', (_req, res) => {
  // Stateless refresh tokens cannot be revoked here; remove this browser's cookie.
  res.clearCookie(refreshCookieName, refreshCookieOptions);
  res.status(200).json({ message: 'Logged out successfully' });
});
