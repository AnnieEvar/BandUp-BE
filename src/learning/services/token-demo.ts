// import { createEmailVerificationToken, createAccessToken } from '../../modules/auth/token.service.js';

// const token =  await createEmailVerificationToken('userId123', 'user@example.com');
// console.log('Email Verification Token:', token);

// Run npx.cmd tsx src/learning/services/token-demo.ts

import {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
} from '../../modules/auth/token.service.js';

const token = await createEmailVerificationToken(
  'userId123',
  'user@example.com',
);

const validResult = await verifyEmailVerificationToken(token);
console.log('Valid token:', validResult);

const invalidResult = await verifyEmailVerificationToken(token + 'x');
console.log('Tampered token:', invalidResult);

console.log(token);
