# Notification System Usage Guide

## Overview
The notification system is now flexible and supports different types of notifications with type-specific payloads stored as JSON. It includes a dedicated `Friend` model for tracking friend relationships with status.

## Database Schema

### Friend Model
Tracks friend relationships between users:
- `requesterId`: User who sent the friend request
- `receiverId`: User who received the friend request
- `status`: PENDING, ACCEPTED, DECLINED, or CANCELLED
- `message`: Optional message with the friend request

### Notification Model
The `Notification` model includes:
- `type`: NotificationType enum (INFO, WARNING, FRIEND_REQUEST, etc.)
- `byUserId`, `byUsername`, `byAvatar`: User who triggered the notification
- `friendId`: Direct link to Friend model (for friend-related notifications)
- `referenceId`: Reference to related entity (friendRequestId, gameId, etc.)
- `payload`: JSON string with type-specific data

## Friend System Usage

### 1. Send a Friend Request

```typescript
import { sendFriendRequest } from "./controllers/friend.controller";

// Send friend request
const friendRequest = await sendFriendRequest(
  "user_123",  // requester
  "user_789",  // receiver
  "Hey! Let's be friends!" // optional message
);

// This automatically:
// 1. Creates a Friend record with PENDING status
// 2. Creates a Notification for the receiver
// 3. Links the notification to the friend request
```

### 2. Accept a Friend Request

```typescript
import { acceptFriendRequest } from "./controllers/friend.controller";

const acceptedFriendship = await acceptFriendRequest("friend_request_id");

// This automatically:
// 1. Updates Friend status to ACCEPTED
// 2. Creates a notification for the requester
```

### 3. Decline or Cancel a Friend Request

```typescript
import { declineFriendRequest, cancelFriendRequest } from "./controllers/friend.controller";

// Receiver declines the request
await declineFriendRequest("friend_request_id");

// Requester cancels their own request
await cancelFriendRequest("friend_request_id");
```

### 4. Get User's Friends

```typescript
import { getUserFriends, areFriends } from "./controllers/friend.controller";

// Get all accepted friends
const friends = await getUserFriends("user_123");

// Check if two users are friends
const isFriend = await areFriends("user_123", "user_789");
```

### 5. Get Pending Friend Requests

```typescript
import { 
  getPendingFriendRequests, 
  getSentFriendRequests 
} from "./controllers/friend.controller";

// Get requests I received (pending)
const receivedRequests = await getPendingFriendRequests("user_123");

// Get requests I sent (pending)
const sentRequests = await getSentFriendRequests("user_123");
```

## Query Friend Notifications

```typescript
// Get all friend-related notifications with friend data
const friendNotifications = await prisma.notification.findMany({
  where: {
    userId: "user_789",
    type: {
      in: ['FRIEND_REQUEST', 'FRIEND_REQUEST_ACCEPTED']
    }
  },
  include: {
    friend: {
      include: {
        requester: true,
        receiver: true,
      }
    }
  },
  orderBy: { createdAt: "desc" }
});

// Access friend status directly
friendNotifications.forEach(notif => {
  console.log(`Friend request status: ${notif.friend?.status}`);
  console.log(`From: ${notif.friend?.requester.username}`);
  console.log(`Message: ${notif.friend?.message}`);
});
```

### 1. Friend Request Notification

```typescript
import { NotificationType } from "./controllers/notify.rabbitmq.controller";
import { FriendRequestPayload } from "./types/notification.types";

const friendRequestPayload: FriendRequestPayload = {
  friendRequestId: "req_12345",
  status: "pending",
  message: "Hey! Let's connect!"
};

const notificationData = {
  type: NotificationType.FRIEND_REQUEST,
  targetId: "user_789", // User receiving the notification
  byUserId: "user_123",
  byUsername: "john_doe",
  byAvatar: "/avatars/john.jpg",
  referenceId: "req_12345", // Same as friendRequestId for easy querying
  payload: friendRequestPayload
};

// Send to RabbitMQ queue
await sendDataToQueue(notificationData, 'notifications');
```

### 2. Game Invite Notification

```typescript
import { GameInvitePayload } from "./types/notification.types";

const gameInvitePayload: GameInvitePayload = {
  gameId: "game_456",
  gameMode: "ranked",
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
};

const notificationData = {
  type: NotificationType.GAME_INVITE,
  targetId: "user_789",
  byUserId: "user_123",
  byUsername: "challenger_pro",
  byAvatar: "/avatars/challenger.jpg",
  referenceId: "game_456",
  payload: gameInvitePayload
};

await sendDataToQueue(notificationData, 'notifications');
```

### 3. Tournament Invite Notification

```typescript
import { TournamentPayload } from "./types/notification.types";

const tournamentPayload: TournamentPayload = {
  tournamentId: "tour_789",
  tournamentName: "Spring Championship 2025",
  startTime: new Date("2025-11-15T18:00:00Z").toISOString()
};

const notificationData = {
  type: NotificationType.TOURNAMENT_INVITE,
  targetId: "user_789",
  byUserId: "admin_001",
  byUsername: "Tournament Admin",
  byAvatar: "/avatars/admin.jpg",
  referenceId: "tour_789",
  payload: tournamentPayload
};

await sendDataToQueue(notificationData, 'notifications');
```

### 4. Coin Gift Received

```typescript
import { CoinGiftPayload } from "./types/notification.types";

const coinGiftPayload: CoinGiftPayload = {
  amount: 500,
  message: "Great game! Here's a tip!"
};

const notificationData = {
  type: NotificationType.COIN_GIFT_RECEIVED,
  targetId: "user_789",
  byUserId: "user_456",
  byUsername: "generous_player",
  byAvatar: "/avatars/generous.jpg",
  payload: coinGiftPayload
};

await sendDataToQueue(notificationData, 'notifications');
```

### 5. Achievement Unlocked

```typescript
import { AchievementPayload } from "./types/notification.types";

const achievementPayload: AchievementPayload = {
  achievementId: "ach_999",
  achievementName: "Master Player",
  achievementIcon: "/icons/master.png"
};

const notificationData = {
  type: NotificationType.ACHIEVEMENT_UNLOCKED,
  targetId: "user_789",
  referenceId: "ach_999",
  payload: achievementPayload
  // No byUserId needed - system notification
};

await sendDataToQueue(notificationData, 'notifications');
```

## Reading Notifications

```typescript
import { parsePayload, FriendRequestPayload } from "./types/notification.types";

// Fetch notifications from database
const notifications = await prisma.notification.findMany({
  where: { userId: "user_789", isRead: false },
  orderBy: { createdAt: "desc" }
});

// Parse payload for specific notification
const notification = notifications[0];
if (notification.type === "FRIEND_REQUEST") {
  const payload = parsePayload<FriendRequestPayload>(notification.payload);
  console.log("Friend request from:", notification.byUsername);
  console.log("Status:", payload?.status);
  console.log("Message:", payload?.message);
}
```

## Querying by Reference ID

```typescript
// Find all notifications related to a specific game
const gameNotifications = await prisma.notification.findMany({
  where: {
    referenceId: "game_456"
  }
});

// Find friend request notification
const friendRequestNotif = await prisma.notification.findFirst({
  where: {
    userId: "user_789",
    type: "FRIEND_REQUEST",
    referenceId: "req_12345"
  }
});
```

## Updating Notification Status

```typescript
// Mark as read
await prisma.notification.update({
  where: { id: "notif_123" },
  data: { isRead: true }
});

// Update friend request payload status
const notification = await prisma.notification.findUnique({
  where: { id: "notif_123" }
});

if (notification && notification.payload) {
  const payload = parsePayload<FriendRequestPayload>(notification.payload);
  if (payload) {
    payload.status = "accepted";
    await prisma.notification.update({
      where: { id: "notif_123" },
      data: { payload: JSON.stringify(payload) }
    });
  }
}
```

## Migration Steps

After updating the schema:

```bash
cd backend/services/notify
npx prisma migrate dev --name add_flexible_notification_fields
npx prisma generate
```

## Notes

- The `payload` field stores JSON as a string for SQLite compatibility
- Use `serializePayload()` and `parsePayload()` helpers for type safety
- `referenceId` allows quick queries without parsing JSON
- `byUserId`, `byUsername`, `byAvatar` are denormalized for performance
