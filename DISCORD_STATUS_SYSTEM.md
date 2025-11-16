# Discord-Like User Status System Implementation

## Overview

This system implements a dual-status architecture similar to Discord, allowing users to have:
1. **Real Status** - Actual WebSocket connection state (ONLINE/OFFLINE)
2. **Custom Status** - User's preferred display status (ONLINE, IDLE, DO_NOT_DISTURB, INVISIBLE)
3. **Visible Status** - What other users actually see (computed from real + custom)

## Key Features

✅ Multi-device/tab support - users can have multiple simultaneous connections  
✅ User can appear offline while still connected (INVISIBLE mode)  
✅ Custom status can only be changed when socket is connected  
✅ Automatic OFFLINE when last socket disconnects  
✅ `lastSeen` timestamp updated only on true disconnection  

---

## Database Schema Changes

### New Enums

```prisma
// Real connection state
enum RealStatus {
  ONLINE    // User has at least one active WebSocket connection
  OFFLINE   // User has no active connections
}

// User preference for how they appear
enum UserStatus {
  ONLINE            // Appear as online
  OFFLINE           // (not used for customStatus)
  IDLE              // Appear as away/idle
  DO_NOT_DISTURB    // Appear as busy
  INVISIBLE         // Appear offline even while connected
}
```

### Profile Model Updates

```prisma
model Profile {
  // ... other fields ...
  
  realStatus   RealStatus   @default(OFFLINE)  // WebSocket connection state
  customStatus UserStatus   @default(ONLINE)   // User's preferred status
  lastSeen     DateTime     @default(now())    // Last disconnection time
  
  // ... other fields ...
}
```

**Removed:** `status` field (replaced by `realStatus`)  
**Removed:** `lastActive` field (consolidated into `lastSeen`)

---

## Status Computation Logic

### Visible Status Rules

The status visible to other users is calculated as:

```typescript
function getVisibleStatus(realStatus: RealStatus, customStatus: UserStatus): UserStatus {
  // Rule 1: If socket disconnected, always show OFFLINE
  if (realStatus === 'OFFLINE') {
    return 'OFFLINE';
  }

  // Rule 2: If user chose INVISIBLE, show OFFLINE (even though connected)
  if (customStatus === 'INVISIBLE') {
    return 'OFFLINE';
  }

  // Rule 3: Otherwise show the custom status
  return customStatus; // ONLINE, IDLE, or DO_NOT_DISTURB
}
```

### Examples

| realStatus | customStatus      | visibleStatus     | Explanation                          |
|------------|-------------------|-------------------|--------------------------------------|
| ONLINE     | ONLINE            | ONLINE            | Normal online state                  |
| ONLINE     | IDLE              | IDLE              | User set themselves as away          |
| ONLINE     | DO_NOT_DISTURB    | DO_NOT_DISTURB    | User set themselves as busy          |
| ONLINE     | INVISIBLE         | **OFFLINE**       | User is hidden (Discord-like)        |
| OFFLINE    | ONLINE            | **OFFLINE**       | Disconnected - always offline        |
| OFFLINE    | INVISIBLE         | **OFFLINE**       | Disconnected - always offline        |

---

## WebSocket Connection Flow

### On Connect
```typescript
// Gateway: backend/gateway/src/events/websocketEvents.ts

1. Add socket to user's socket Set (supports multiple connections)
2. Add userId to Redis online_users set
3. Call user service: PUT /api/user/realtime
   Body: { realStatus: "ONLINE" }
4. User service computes visibleStatus from realStatus + customStatus
5. Broadcast status update to friends/subscribers
```

### On Disconnect
```typescript
// Gateway: backend/gateway/src/events/websocketEvents.ts

1. Remove socket from user's socket Set
2. IF this was the last socket:
   a. Remove userId from Redis online_users set
   b. Call user service: PUT /api/user/realtime
      Body: { realStatus: "OFFLINE", updateLastSeen: true }
   c. User service sets realStatus = OFFLINE, lastSeen = now()
   d. visibleStatus becomes OFFLINE (regardless of customStatus)
   e. Broadcast offline status to friends
3. ELSE (user has other active sockets):
   - Do nothing, user remains ONLINE
```

---

## API Endpoints

### Update Custom Status

**Endpoint:** `PUT /api/user/db`  
**Auth:** Required (cookie)  
**Body:**
```json
{
  "customStatus": "ONLINE" | "IDLE" | "DO_NOT_DISTURB" | "INVISIBLE"
}
```

**Validation:**
- User must be currently connected (realStatus = ONLINE)
- If realStatus = OFFLINE, returns error: `"Cannot change custom status while disconnected"`

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

**Side Effects:**
1. Updates `customStatus` in database
2. Computes new `visibleStatus`
3. Updates Redis cache
4. Notifies chat service and notify service with new visibleStatus
5. Broadcasts status change to friends

### Get User Profile

**Endpoint:** `GET /api/user/me` or `GET /api/user/username/:username`

**Response includes:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "username": "player1",
    "realStatus": "ONLINE",
    "customStatus": "INVISIBLE",
    // Note: Other users will see visibleStatus = "OFFLINE"
    // but the user themselves can see their real customStatus
    ...
  }
}
```

---

## Frontend Usage

### Update Custom Status

```typescript
import { updateCustomStatus } from '@/api/user';

// User clicks "Set status to Invisible"
await updateCustomStatus('INVISIBLE');

// User clicks "Set status to Do Not Disturb"
await updateCustomStatus('DO_NOT_DISTURB');

// User clicks "Set status to Online"
await updateCustomStatus('ONLINE');
```

### Error Handling

```typescript
try {
  await updateCustomStatus('INVISIBLE');
} catch (error) {
  if (error.message.includes('disconnected')) {
    // Show: "You must be connected to change your status"
  }
}
```

---

## Migration Steps

### 1. Generate Migration

```bash
cd backend/services/user
npx prisma migrate dev --name add-dual-status-system
```

### 2. Expected Migration

```sql
-- AlterTable: Rename status -> realStatus (manual data migration)
-- AlterTable: Add INVISIBLE to UserStatus enum
-- AlterTable: Change status column type to RealStatus
-- AlterTable: Drop lastActive column
```

### 3. Data Migration (if needed)

If you have existing users, you may need to:

```sql
-- Set all existing users to OFFLINE by default
UPDATE Profile SET realStatus = 'OFFLINE';

-- Set customStatus to ONLINE for all users
UPDATE Profile SET customStatus = 'ONLINE';
```

---

## Testing Scenarios

### Test 1: Multi-Device Support

1. Open browser tab 1 and log in → realStatus = ONLINE
2. Open browser tab 2 with same user → realStatus = ONLINE (2 sockets)
3. Close tab 1 → realStatus = ONLINE (1 socket remains)
4. Close tab 2 → realStatus = OFFLINE, lastSeen updated

**Expected:** User only goes OFFLINE when ALL tabs/devices disconnect

### Test 2: Invisible Mode

1. User connects → realStatus = ONLINE, customStatus = ONLINE, visibleStatus = ONLINE
2. User calls `updateCustomStatus('INVISIBLE')` → visibleStatus = OFFLINE
3. Friends see user as OFFLINE
4. User can still receive messages, play games, etc.

**Expected:** User appears offline but remains fully functional

### Test 3: Cannot Change Status While Offline

1. User disconnects → realStatus = OFFLINE
2. User tries to call `updateCustomStatus('IDLE')` → ERROR
3. User must reconnect first

**Expected:** API returns error: "Cannot change custom status while disconnected"

### Test 4: lastSeen Timestamp

1. User connects at 10:00 AM
2. User disconnects at 10:30 AM → lastSeen = 10:30 AM
3. User reconnects at 11:00 AM → lastSeen unchanged (still 10:30 AM)
4. User disconnects at 11:15 AM → lastSeen = 11:15 AM

**Expected:** lastSeen only updates on disconnect, not connect

---

## Files Changed

### Backend - User Service

- `prisma/schema.prisma` - Added RealStatus enum, updated Profile model
- `src/utils/statusHelper.ts` - New file with status computation logic
- `src/controllers/user.controller.ts` - Updated handlers to use dual status
- `src/routes/user.routes.ts` - Removed custom status endpoints (using /api/user/db)

### Backend - Gateway

- `src/events/websocketEvents.ts` - Updated connect/disconnect to handle realStatus

### Frontend

- `src/api/user.ts` - Added `updateCustomStatus` helper using existing endpoint

---

## Architecture Diagram

```
┌─────────────────┐
│  WebSocket      │
│  Connection     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Gateway                            │
│  - Tracks sockets per user          │
│  - Sets realStatus (ONLINE/OFFLINE) │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  User Service                       │
│  - Validates customStatus changes   │
│  - Computes visibleStatus           │
│  - Persists to DB + Redis           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Database                           │
│  - realStatus: ONLINE/OFFLINE       │
│  - customStatus: ONLINE/IDLE/etc    │
│  - lastSeen: DateTime               │
└─────────────────────────────────────┘

visibleStatus = f(realStatus, customStatus)
```

---

## Benefits

✅ **Discord-like UX** - Users can go invisible  
✅ **Multi-device** - Multiple tabs/devices supported  
✅ **Accurate presence** - Only OFFLINE when truly disconnected  
✅ **Data privacy** - User controls how they appear  
✅ **Scalable** - Efficient socket tracking with Map<userId, Set<WebSocket>>  

---

## Next Steps

1. ✅ Update Prisma schema
2. ✅ Create status helper utilities
3. ✅ Update gateway WebSocket handlers
4. ✅ Update user service controllers
5. ✅ Update frontend API
6. ⏳ Run Prisma migration
7. ⏳ Test multi-device scenarios
8. ⏳ Update UI to show status selector dropdown

---

## Quick Start Commands

```bash
# Run migration
cd backend/services/user
npx prisma migrate dev --name add-dual-status-system

# Generate Prisma client
npx prisma generate

# Restart services
docker-compose down
docker-compose up --build

# Or restart individual services
cd backend/gateway && npm run dev
cd backend/services/user && npm run dev
```
