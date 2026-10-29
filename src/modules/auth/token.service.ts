import 'dotenv/config';
import { SignJWT, jwtVerify, errors } from 'jose';

function getSigningKey(name: 'JWT_EMAIL_VERIFICATION_SECRET' | 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): Uint8Array {
  const secret = process.env[name];

  if (!secret || secret.length < 32) {
    throw new Error(`${name} must contain at least 32 characters in .env`);
  }

  return new TextEncoder().encode(secret);
}

function getIssuer(): string {
  return process.env.JWT_ISSUER ?? 'bandup-api';
}

function getAudience(): string {
  return process.env.JWT_AUDIENCE ?? 'bandup-web';
}

export async function createEmailVerificationToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ email, tokenType: 'emailVerification' })
    .setProtectedHeader({ typ: 'JWT', alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(getIssuer())
    .setAudience(getAudience())
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(getSigningKey('JWT_EMAIL_VERIFICATION_SECRET'));
}

export async function verifyEmailVerificationToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey('JWT_EMAIL_VERIFICATION_SECRET'), {
      algorithms: ['HS256'],
      issuer: getIssuer(),
      audience: getAudience(),
      requiredClaims: ['sub', 'exp', 'email', 'tokenType'],
    });

    if (
      typeof payload.sub !== 'string' ||
      payload.sub === '' ||
      typeof payload.email !== 'string' ||
      payload.email === '' ||
      payload.tokenType !== 'emailVerification'
    ) {
      return null;
    }

    return { userId: payload.sub, email: payload.email };
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export async function createAccessToken(userId: string, email: string, role: string): Promise<string> {
  return new SignJWT({ email, role, tokenType: 'access' })
    .setProtectedHeader({ typ: 'JWT', alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(getIssuer())
    .setAudience(getAudience())
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(getSigningKey('JWT_ACCESS_SECRET'));
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ tokenType: 'refresh' })
    .setProtectedHeader({ typ: 'JWT', alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(getIssuer())
    .setAudience(getAudience())
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSigningKey('JWT_REFRESH_SECRET'));
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey('JWT_REFRESH_SECRET'), {
      algorithms: ['HS256'],
      issuer: getIssuer(),
      audience: getAudience(),
      requiredClaims: ['sub', 'exp', 'tokenType'],
    });

    if (typeof payload.sub !== 'string' || payload.sub === '' || payload.tokenType !== 'refresh') {
      return null;
    }

    return payload.sub;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}
