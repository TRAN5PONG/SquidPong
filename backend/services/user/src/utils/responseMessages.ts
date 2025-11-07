// responseMessages.ts



export enum ProfileMessages {
  ITEM_NOT_OWNED = 'One or more selected items are not owned by the user.',
  PLAYER_IS_NOT_OWNED = 'The player skin is not owned by the user.',
  PADDLE_IS_NOT_OWNED = 'The paddle skin is not owned by the user.',
  NOT_FOUND = 'Profile not found.',
  READY_EXISTS = 'The username is already taken.',
  SAME_USERNAME = 'The new username is the same as the current one.',
  FETCH_SUCCESS = 'Profile fetched successfully.',
  FETCH_NOT_FOUND = 'Profile not found in the database.',

  CREATE_SUCCESS = 'Profile created successfully.',
  CREATE_FAILED = 'Failed to create profile.',

  UPDATE_SUCCESS = 'Profile updated successfully.',
  UPDATE_FAILED = 'Failed to update profile.',
  UPDATE_NOT_FOUND = 'Profile to update not found.',

  DELETE_SUCCESS = 'Profile deleted successfully.',
  DELETE_FAILED = 'Failed to delete profile.',
  DELETE_NOT_FOUND = 'Profile to delete not found.',

  INVALID_REQUEST = 'Invalid request for profile.',
  SERVER_ERROR = 'Internal server error while handling profile.',

  CACHE_HIT = 'Profile loaded from cache.',
  CACHE_MISS = 'Profile not found in cache, loading from DB.',
}


export enum PreferenceMessages {
  FETCH_SUCCESS = 'Preferences fetched successfully.',
  FETCH_NOT_FOUND = 'Preferences not found in the database.',

  UPDATE_SUCCESS = 'Preferences updated successfully.',
  UPDATE_FAILED = 'Failed to update preferences.',
  UPDATE_NOT_FOUND = 'Preferences to update not found.',

  INVALID_REQUEST = 'Invalid request for preferences.',
  SERVER_ERROR = 'Internal server error while handling preferences.',
}

export enum NotificationMessages {
  FETCH_SUCCESS = 'Notifications fetched successfully.',
  FETCH_NOT_FOUND = 'Notifications not found in the database.',

  UPDATE_SUCCESS = 'Notifications updated successfully.',
  UPDATE_FAILED = 'Failed to update notifications.',
  UPDATE_NOT_FOUND = 'Notifications to update not found.',

  INVALID_REQUEST = 'Invalid request for notifications.',
  SERVER_ERROR = 'Internal server error while handling notifications.',
}
export enum GeneralMessages {
  INVALID_ID = 'The provided ID is invalid.',
  MISSING_FIELDS = 'Required fields are missing in the request.',
  UNAUTHORIZED = 'You are not authorized to perform this action.',
  FORBIDDEN = 'Access to this resource is forbidden.',
  BAD_REQUEST = 'The request could not be understood or was missing required parameters.',
  NOT_FOUND = 'The requested resource was not found.',
  CONFLICT = 'A resource with the given identifier already exists.',
  RATE_LIMITED = 'Too many requests, please try again later.',
  SERVICE_UNAVAILABLE = 'The service is currently unavailable, please try again later.',
}

export enum FriendMessages {
  ADD_SELF = 'You cannot send a friend request to yourself.',
  NOT_FRIENDS = 'You can only block existing friends.',
  FETCH_SUCCESS = 'Friends list fetched successfully.',
  FETCH_NOT_FOUND = 'No friends found for the user.',
  PENDING_FETCH_SUCCESS = 'Pending friend requests fetched successfully.',
  ADD_SUCCESS = 'Friend request sent successfully.',
  ADD_FAILED = 'Failed to send friend request.',
  ADD_ALREADY_EXISTS = 'A friend request already exists or you are already friends.',


  FRIENDSHIP_VERIFY_SUCCESS = 'Friendship verified successfully.',
  FRIENDSHIP_VERIFY_FAILED = 'Failed to verify friendship.',
  FRIENDSHIP_VERIFY_NOT_FOUND = 'No friendship found between the users.', 


  
  CANCEL_SUCCESS = 'Friend request canceled successfully.',
  CANCEL_FAILED = 'Failed to cancel friend request.',
  CANCEL_NOT_FOUND = 'No pending friend request found to cancel.',
  ACCEPT_SUCCESS = 'Friend request accepted successfully.',
  ACCEPT_FAILED = 'Failed to accept friend request.',
  ACCEPT_NOT_FOUND = 'No pending friend request found to accept.',

  REJECT_SUCCESS = 'Friend request rejected successfully.',
  REJECT_FAILED = 'Failed to reject friend request.',
  REJECT_NOT_FOUND = 'No pending friend request found to reject.',

  REMOVE_SUCCESS = 'Friend removed successfully.',
  REMOVE_FAILED = 'Failed to remove friend.',
  REMOVE_NOT_FOUND = 'No friendship found to remove.',

  INVALID_REQUEST = 'Invalid request for friendship operation.',
  SERVER_ERROR = 'Internal server error while handling friendship operation.',
}

export enum BlockMessages {
  BLOCK_NO_FRIEND = 'You can only block existing friends.',
  BLOCK_SUCCESS = 'User blocked successfully.',
  BLOCK_FAILED = 'Failed to block user.',
  BLOCK_NOT_FOUND = 'No friendship found to block user.',

  UNBLOCK_SUCCESS = 'User unblocked successfully.',
  UNBLOCK_FAILED = 'Failed to unblock user.',
  UNBLOCK_NOT_FOUND = 'No blocked friendship found to unblock user.',

  FETCH_BLOCKED_SUCCESS = 'Blocked users fetched successfully.',
  FETCH_BLOCKED_NOT_FOUND = 'No blocked users found.',

  INVALID_REQUEST = 'Invalid request for block operation.',
  SERVER_ERROR = 'Internal server error while handling block operation.',
}

// redis.ts