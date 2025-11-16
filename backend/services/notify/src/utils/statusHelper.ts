import { UserStatus } from '@prisma/client';

/**
 * Computes the visible status based on real connection status and custom status
 * 
 * Rules:
 * - If status is OFFLINE, always return OFFLINE
 * - If status is ONLINE and customStatus is INVISIBLE, return OFFLINE
 * - If status is ONLINE, return customStatus
 * 
 * @param status - Real connection status (ONLINE/OFFLINE)
 * @param customStatus - User's custom status preference
 * @returns The visible status that should be shown to others
 */
export function getVisibleStatus(
  status: UserStatus | string,
  customStatus: UserStatus | string
): UserStatus | string {
  if (status === 'OFFLINE') {
    return 'OFFLINE';
  }

  if (customStatus === 'INVISIBLE') {
    return 'OFFLINE';
  }

  return customStatus;
}
