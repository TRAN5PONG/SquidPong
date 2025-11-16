# Final Discord-Like Status System

## Overview

The system now uses a clean dual-status architecture:

1. **`status`** - Real WebSocket connection state (ONLINE or OFFLINE) - **controlled automatically**
2. **`customStatus`** - User's display preference (ONLINE, IDLE, DO_NOT_DISTURB, INVISIBLE) - **NO OFFLINE option**

## How It Works

### Database Schema

```prisma
model Profile {
  status       UserStatus   @default(OFFLINE)  // ONLINE or OFFLINE (WebSocket state)
  customStatus UserStatus   @default(ONLINE)   // ONLINE, IDLE, DO_NOT_DISTURB, INVISIBLE
  lastSeen     DateTime     @default(now())
  // ... other fields
}
```

### Status Visibility Rules

When users fetch profile data (via API), the visible status is computed:

```typescript
// Rule 1: If user is disconnected, always show OFFLINE
if (status === 'OFFLINE') {
  return 'OFFLINE';
}

// Rule 2: If user chose INVISIBLE, show OFFLINE (even if connected)
if (customStatus === 'INVISIBLE') {
  return 'OFFLINE';
}

// Rule 3: Otherwise show the user's custom status
return customStatus; // ONLINE, IDLE, or DO_NOT_DISTURB
```

## Examples

| Real Status | Custom Status     | What Others See   | Explanation                          |
|-------------|-------------------|-------------------|--------------------------------------|
| OFFLINE     | ONLINE            | **OFFLINE**       | User disconnected                    |
| OFFLINE     | IDLE              | **OFFLINE**       | User disconnected                    |
| OFFLINE     | INVISIBLE         | **OFFLINE**       | User disconnected                    |
| ONLINE      | ONLINE            | ONLINE            | Normal online state                  |
| ONLINE      | IDLE              | IDLE              | User is away                         |
| ONLINE      | DO_NOT_DISTURB    | DO_NOT_DISTURB    | User is busy                         |
| ONLINE      | INVISIBLE         | **OFFLINE**       | User hidden (Discord-like)           |

## API Behavior

### Update Custom Status

**Endpoint:** `PUT /api/user/db`  
**Body:**
```json
{
  "customStatus": "IDLE"  // or ONLINE, DO_NOT_DISTURB, INVISIBLE
}
```

**Validation:**
- ✅ ONLINE, IDLE, DO_NOT_DISTURB, INVISIBLE are allowed
- ❌ OFFLINE is NOT allowed (error: "Invalid customStatus")
- ⚠️ User must be connected (status === ONLINE) to change customStatus

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### Get User Profile

**Endpoints:**
- `GET /api/user/me`
- `GET /api/user/username/:username`
- `GET /api/user/id/:id`

**What Happens:**
1. Profile fetched from database (includes real `status` and `customStatus`)
2. Merged with Redis cache
3. **`mergeProfileWithRedis` computes visible status:**
   - If `status === 'OFFLINE'` → return `status: 'OFFLINE'`
   - If `status === 'ONLINE'` and `customStatus === 'INVISIBLE'` → return `status: 'OFFLINE'`
   - If `status === 'ONLINE'` → return `status: customStatus`

**Response Example (User is Online and set to IDLE):**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "username": "player1",
    "status": "IDLE",  // This is the computed visible status
    "customStatus": "IDLE",
    "lastSeen": "2025-11-16T10:30:00Z",
    ...
  }
}
```

**Response Example (User is Offline):**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "username": "player1",
    "status": "OFFLINE",  // Computed: real status is OFFLINE
    "customStatus": "IDLE",  // User's preference (will apply when they connect)
    "lastSeen": "2025-11-16T10:30:00Z",
    ...
  }
}
```

**Response Example (User is Online but Invisible):**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "username": "player1",
    "status": "OFFLINE",  // Computed: appears offline due to INVISIBLE
    "customStatus": "INVISIBLE",
    ...
  }
}
```

## WebSocket Flow

### On Connect
```typescript
// Gateway sets real status to ONLINE
await updatestatus(userId, 'ONLINE', false);

// Database now has:
// status = 'ONLINE'
// customStatus = <whatever user previously set>

// Visible status = customStatus (unless INVISIBLE, then OFFLINE)
```

### On Disconnect
```typescript
// Gateway sets real status to OFFLINE
await updatestatus(userId, 'OFFLINE', true);

// Database now has:
// status = 'OFFLINE'
// customStatus = <unchanged>
// lastSeen = <updated to now>

// Visible status = OFFLINE (always, because disconnected)
```

## Implementation Details

### mergeProfileWithRedis (utils/utils.ts)

```typescript
export async function mergeProfileWithRedis(profile: any): Promise<any> 
{
  const cacheKey = `profile:${userId}`;
  let mergedProfile = profile;
  
  if (await redis.exists(cacheKey)) {
    const redisProfile = await redis.get(cacheKey);
    mergedProfile = { ...profile, ...redisProfile };
  }
  
  // Compute visible status based on connection state
  if (mergedProfile.status && mergedProfile.customStatus) {
    mergedProfile.status = getVisibleStatus(
      mergedProfile.status,      // Real connection state
      mergedProfile.customStatus // User's preference
    );
  }
  
  return mergedProfile;
}
```

### getVisibleStatus (utils/statusHelper.ts)

```typescript
export function getVisibleStatus(status: UserStatus, customStatus: UserStatus): UserStatus {
  // If disconnected, always show OFFLINE
  if (status === 'OFFLINE') {
    return 'OFFLINE';
  }

  // If invisible, show OFFLINE even though connected
  if (customStatus === 'INVISIBLE') {
    return 'OFFLINE';
  }

  // Otherwise show custom status
  return customStatus;
}
```

## User Experience

### Scenario 1: User Goes Away
1. User is online with `customStatus: 'ONLINE'`
2. User changes status: `PUT /api/user/db { customStatus: 'IDLE' }`
3. Others now see: `status: 'IDLE'`
4. User is still connected, can chat, play games, etc.

### Scenario 2: User Goes Invisible
1. User is online with `customStatus: 'ONLINE'`
2. User changes status: `PUT /api/user/db { customStatus: 'INVISIBLE' }`
3. Others now see: `status: 'OFFLINE'` (but user is still connected!)
4. User can still do everything, just appears offline

### Scenario 3: User Disconnects
1. User was online with `customStatus: 'IDLE'`
2. User closes browser/loses connection
3. Gateway sets real `status: 'OFFLINE'`
4. Others now see: `status: 'OFFLINE'`
5. When user reconnects, they will appear as `IDLE` again (their preference is saved)

### Scenario 4: User Sets Status While Offline
1. User tries: `PUT /api/user/db { customStatus: 'INVISIBLE' }`
2. Backend checks: `if (existingProfile.status !== 'ONLINE')` → ERROR
3. Response: `"Cannot change custom status while disconnected. Please connect first."`

## Benefits

✅ **Separation of Concerns** - `status` = connection, `customStatus` = preference  
✅ **No OFFLINE in customStatus** - Users can't manually set themselves offline  
✅ **Discord-Like Invisible Mode** - Users can hide while staying connected  
✅ **Persistent Preferences** - Custom status survives reconnects  
✅ **Automatic Status Updates** - Real status managed by WebSocket  
✅ **Clean API** - One endpoint for status changes  

## Files Modified

- ✅ `prisma/schema.prisma` - Already has both fields
- ✅ `utils/statusHelper.ts` - Computes visible status
- ✅ `utils/utils.ts` - mergeProfileWithRedis now computes visible status
- ✅ `controllers/user.controller.ts` - Validates customStatus (no OFFLINE allowed)
- ✅ `gateway/events/websocketEvents.ts` - Sets real status ONLINE/OFFLINE

## Migration

No migration needed! Schema already has both `status` and `customStatus` fields. Just need to ensure all existing users have valid `customStatus` values (default is already `ONLINE`).
