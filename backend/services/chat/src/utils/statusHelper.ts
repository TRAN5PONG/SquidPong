/**
 * Status Helper Utilities for Chat Service
 * Handles logic for computing visible user status from real connection state and custom preference
 */

import { UserStatus, UserStatusCustom } from '@prisma/client';

/**
 * Calculate the visible status that other users should see
 * 
 * Rules:
 * 1. If status is OFFLINE, always show OFFLINE (user disconnected)
 * 2. If customStatus is INVISIBLE, show OFFLINE (even if connected)
 * 3. Otherwise, show the customStatus (ONLINE, IDLE, DO_NOT_DISTURB)
 * 
 * @param status - Actual WebSocket connection state
 * @param customStatus - User's preferred display status
 * @returns The status visible to other users
 */
export function getVisibleStatus(status: UserStatus, customStatus: UserStatusCustom): UserStatus {
  // Rule 1: If socket disconnected, always appear offline
  if (status === 'OFFLINE') {
    return 'OFFLINE';
  }

  // Rule 2: If user chose invisible, appear offline even though connected
  if (customStatus === 'INVISIBLE') {
    return 'OFFLINE';
  }

  // Rule 3: Otherwise show the custom status
  return 'ONLINE';
}
