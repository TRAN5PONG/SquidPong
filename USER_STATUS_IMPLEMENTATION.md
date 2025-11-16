# User Activity Status Implementation

## Overview
This implementation adds a robust user activity tracking system with custom status support. Users can set their preferred online status (ONLINE, IDLE, DO_NOT_DISTURB), and the system automatically handles status changes based on connection state.

## Key Features

### 1. **Custom Status Management**
- Users can set their preferred status when online (ONLINE, IDLE, DO_NOT_DISTURB)
- The custom status is preserved in the database
- When user reconnects, their custom status is restored instead of defaulting to ONLINE

### 2. **Last Active Tracking**
- `lastActive` field tracks the last time a user was active
- Updated automatically when user disconnects
- Useful for showing "last seen" information

### 3. **Automatic Status Management**
- On **Connect**: Restores user's custom status
- On **Disconnect**: Sets status to OFFLINE and updates lastActive timestamp

## Database Changes

### Schema Updates (`backend/services/user/prisma/schema.prisma`)

```prisma
model Profile {
  // ... other fields
  
  status       UserStatus   @default(OFFLINE)      // Current active status
  customStatus UserStatus   @default(ONLINE)        // User's preferred online status
  lastSeen     DateTime     @default(now())         // Last time user was seen
  lastActive   DateTime     @default(now())         // Last activity timestamp
  
  // ... other fields
}
```

**New Field: `customStatus`**
- Stores user's preferred status (ONLINE, IDLE, DO_NOT_DISTURB)
- Defaults to ONLINE
- Used to restore status when user reconnects

**Updated Field: `lastActive`**
- Tracks when user was last active
- Updated on disconnect

## Backend Changes

### 1. Gateway WebSocket Events (`backend/gateway/src/events/websocketEvents.ts`)

#### Updated Functions:

**`updatestatus(userId, status, updateLastActive)`**
- Now accepts optional `updateLastActive` parameter
- Updates `lastActive` timestamp when user goes offline

**`getUserCustomStatus(userId)`**
- New function to fetch user's custom status from database
- Returns ONLINE as fallback

**`handleWsConnect(ws, req)`**
- Fetches user's custom status
- Restores it instead of defaulting to ONLINE

**`onClientDisconnect(ws)`**
- Sets status to OFFLINE
- Updates `lastActive` timestamp

### 2. User Service Controller (`backend/services/user/src/controllers/user.controller.ts`)

#### Updated Endpoints:

**`PUT /api/user/realtime`** (updateProfileHandler)
- Now handles `updateLastActive` parameter
- Updates `lastActive` when status changes to OFFLINE

#### New Endpoints:

**`GET /api/user/custom-status/:userId`** (getCustomStatusHandler)
- Retrieves user's custom status
- Used by gateway to restore status on reconnect

**`PUT /api/user/custom-status`** (updateCustomStatusHandler)
- Allows users to set their preferred online status
- Validates status (ONLINE, IDLE, DO_NOT_DISTURB)
- Updates both `customStatus` and current `status` if user is online
- Updates Redis cache

### 3. Routes (`backend/services/user/src/routes/user.routes.ts`)

Added new routes:
```typescript
{ method: 'GET', url: '/api/user/custom-status/:userId', handler: userController.getCustomStatusHandler },
{ method: 'PUT', url: '/api/user/custom-status', handler: userController.updateCustomStatusHandler },
```

## Frontend Changes

### API (`frontend/src/api/user.ts`)

**New Function: `updateCustomStatus(customStatus)`**
- Allows frontend to update user's custom status
- Sends PUT request to `/api/user/custom-status`

## Usage Flow

### 1. User Sets Custom Status
```typescript
// Frontend
import { updateCustomStatus } from '@/api/user';

await updateCustomStatus('IDLE'); // or 'ONLINE', 'DO_NOT_DISTURB'
```

### 2. User Connects to WebSocket
1. Gateway receives connection
2. Fetches user's `customStatus` from database
3. Sets user's active status to their custom status
4. Adds user to online users list

### 3. User Disconnects
1. Gateway detects disconnect
2. Sets status to OFFLINE
3. Updates `lastActive` timestamp
4. Removes user from online users list

### 4. User Reconnects
1. Gateway fetches custom status (e.g., IDLE)
2. Sets status to IDLE (not ONLINE)
3. User appears with their preferred status

## Migration Steps

To apply these changes:

1. **Run Prisma Migration**
```bash
cd backend/services/user
npx prisma migrate dev --name add_custom_status_and_last_active
```

2. **Restart Services**
```bash
# Rebuild and restart all services
docker-compose down
docker-compose up --build
```

## Example Scenarios

### Scenario 1: User sets status to IDLE
1. User calls `updateCustomStatus('IDLE')`
2. Database stores: `customStatus = IDLE`, `status = IDLE`
3. User disconnects
4. Status becomes OFFLINE, `lastActive` updates
5. User reconnects
6. Status restores to IDLE (their custom status)

### Scenario 2: User sets DO_NOT_DISTURB
1. User calls `updateCustomStatus('DO_NOT_DISTURB')`
2. Even after disconnect/reconnect cycles
3. User always returns as DO_NOT_DISTURB when online

## Benefits

1. **Better UX**: Users don't have to reset their status after every reconnection
2. **Activity Tracking**: Track when users were last active
3. **Flexibility**: Users can set their availability preference
4. **Consistency**: Status persists across sessions

## API Reference

### Update Custom Status
```typescript
PUT /api/user/custom-status
Headers: x-user-id
Body: { customStatus: "IDLE" | "ONLINE" | "DO_NOT_DISTURB" }
```

### Get Custom Status
```typescript
GET /api/user/custom-status/:userId
Headers: x-secret-token
Response: { customStatus: "IDLE" }
```

### Realtime Status Update (Internal)
```typescript
PUT /api/user/realtime
Headers: x-user-id, x-secret-token
Body: { status: "OFFLINE", updateLastActive: true }
```
