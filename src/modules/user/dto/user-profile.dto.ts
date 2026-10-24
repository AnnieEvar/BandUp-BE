import type {
  UserRole,
  UserStatus,
} from '../../../generated/prisma/enums.js';

export type UserProfileDto = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
