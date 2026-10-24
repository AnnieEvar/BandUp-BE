import type { RequestHandler } from 'express';
import { jwtVerify } from 'jose';

const accessTokenIssuer = process.env.JWT_ISSUER ?? 'bandup-api';
const accessTokenAudience = process.env.JWT_AUDIENCE ?? 'bandup-web';

function getAccessTokenSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_ACCESS_SECRET must contain at least 32 characters in .env',
    );
  }

  return new TextEncoder().encode(secret);
}

export const authenticationMiddleware: RequestHandler = async (
  req,
  res,
  next,
) => {
  const authorization = req.get('authorization');
  const [scheme, token, extraPart] = authorization?.split(' ') ?? [];

  if (
    scheme?.toLowerCase() !== 'bearer' ||
    !token ||
    extraPart !== undefined
  ) {
    res.status(401).json({
      message: 'Thiếu hoặc sai định dạng access token',
    });
    return;
  }

  const secret = getAccessTokenSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: accessTokenIssuer,
      audience: accessTokenAudience,
    });

    if (typeof payload.sub !== 'string' || payload.tokenType !== 'access') {
      res.status(401).json({
        message: 'Access token không hợp lệ',
      });
      return;
    }

    res.locals.authUserId = payload.sub;
    next();
  } catch {
    res.status(401).json({
      message: 'Access token không hợp lệ hoặc đã hết hạn',
    });
  }
};
