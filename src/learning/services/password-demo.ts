import {
  hashPassword,
  verifyPassword,
} from '../../modules/auth/password.service.js';

const password = 'BandUp@123';

const passwordHash = await hashPassword(password);

const correctResult = await verifyPassword(
  'BandUp@123',
  passwordHash,
);

const wrongResult = await verifyPassword(
  'SaiMatKhau',
  passwordHash,
);

console.log({
  passwordHash,
  correctResult,
  wrongResult,
});