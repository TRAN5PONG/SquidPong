/**
 * Status Helper Utilities
 * Handles logic for computing visible user status from real connection state and custom preference
 */

export type UserStatus = 'ONLINE' | 'OFFLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'INVISIBLE';

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
export function getVisibleStatus(status: UserStatus, customStatus: UserStatus): UserStatus {
  // Rule 1: If socket disconnected, always appear offline
  if (status === 'OFFLINE') {
    return 'OFFLINE';
  }

  // Rule 2: If user chose invisible, appear offline even though connected
  if (customStatus === 'INVISIBLE') {
    return 'OFFLINE';
  }

  // Rule 3: Otherwise show the custom status
  return customStatus;
}

/**
 * Validate if a user can change their custom status
 * Users can only change custom status when they have an active WebSocket connection
 * 
 * @param status - Actual WebSocket connection state
 * @returns true if user can change custom status, false otherwise
 */
export function canChangeCustomStatus(status: UserStatus): boolean {
  return status === 'ONLINE';
}

/**
 * Get a user-friendly explanation of status behavior
 */
export function getStatusExplanation(status: UserStatus, customStatus: UserStatus): string {
  const visibleStatus = getVisibleStatus(status, customStatus);
  
  if (status === 'OFFLINE') {
    return `Disconnected - appears as ${visibleStatus}`;
  }
  
  if (customStatus === 'INVISIBLE') {
    return `Connected but invisible - appears as ${visibleStatus} to others`;
  }
  
  return `Connected - appears as ${visibleStatus}`;
}
