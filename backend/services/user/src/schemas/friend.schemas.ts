import { FastifySchema } from 'fastify';

// =============================================
// FRIEND MANAGEMENT SCHEMAS
// =============================================

// Common response schemas
const successResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: { type: 'object', nullable: true }
  },
  required: ['success', 'message']
};

const errorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    error: { type: 'string', nullable: true }
  },
  required: ['success', 'message']
};

// Profile object schema (simplified for friend lists)
const friendProfileSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'number' },
    username: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    avatar: { type: 'string' },
    status: { 
      type: 'string',
      enum: ['ONLINE', 'OFFLINE', 'AWAY', 'BUSY']
    },
    isVerified: { type: 'boolean' }
  }
};

// =============================================
// FRIEND REQUEST SCHEMAS
// =============================================

export const sendFriendRequestSchema: FastifySchema = {
  description: 'Send friend request to another user',
  tags: ['Friend Management'],
  summary: 'Send Friend Request',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  body: {
    type: 'object',
    properties: {
      receiverId: {
        type: 'number',
        description: 'ID of the user to send friend request to'
      }
    },
    required: ['receiverId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Friend request sent successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid receiver ID or friendship already exists'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

export const acceptFriendRequestSchema: FastifySchema = {
  description: 'Accept incoming friend request',
  tags: ['Friend Management'],
  summary: 'Accept Friend Request',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  body: {
    type: 'object',
    properties: {
      senderId: {
        type: 'number',
        description: 'ID of the user who sent the friend request'
      }
    },
    required: ['senderId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Friend request accepted successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid sender ID'
    },
    404: {
      ...errorResponse,
      description: 'Friend request not found'
    }
  }
};

export const rejectFriendRequestSchema: FastifySchema = {
  description: 'Reject incoming friend request',
  tags: ['Friend Management'],
  summary: 'Reject Friend Request',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  body: {
    type: 'object',
    properties: {
      senderId: {
        type: 'number',
        description: 'ID of the user who sent the friend request'
      }
    },
    required: ['senderId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Friend request rejected successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid sender ID'
    },
    404: {
      ...errorResponse,
      description: 'Friend request not found'
    }
  }
};

// =============================================
// FRIENDS LIST SCHEMAS
// =============================================

export const getFriendsListSchema: FastifySchema = {
  description: 'Get list of all friends (online and offline)',
  tags: ['Friend Management'],
  summary: 'Get Friends List',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: friendProfileSchema
        }
      },
      description: 'Friends list retrieved successfully'
    },
    500: {
      ...errorResponse,
      description: 'Internal server error'
    }
  }
};

export const getPendingRequestsSchema: FastifySchema = {
  description: 'Get pending friend requests (sent and received)',
  tags: ['Friend Management'],
  summary: 'Get Pending Friend Requests',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            sent: {
              type: 'array',
              items: friendProfileSchema,
              description: 'Friend requests sent by current user'
            },
            received: {
              type: 'array',
              items: friendProfileSchema,
              description: 'Friend requests received by current user'
            }
          }
        }
      },
      description: 'Pending requests retrieved successfully'
    },
    500: {
      ...errorResponse,
      description: 'Internal server error'
    }
  }
};

// =============================================
// FRIEND MANAGEMENT SCHEMAS
// =============================================

export const removeFriendSchema: FastifySchema = {
  description: 'Remove a friend from friends list',
  tags: ['Friend Management'],
  summary: 'Remove Friend',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      friendId: {
        type: 'string',
        description: 'ID of the friend to remove'
      }
    },
    required: ['friendId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Friend removed successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid friend ID'
    },
    404: {
      ...errorResponse,
      description: 'Friendship not found'
    }
  }
};

export const verifyFriendshipSchema: FastifySchema = {
  description: 'Verify friendship status between two users (internal service call)',
  tags: ['Friend Management'],
  summary: 'Verify Friendship',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      },
      'x-secret-token': {
        type: 'string',
        description: 'Internal service authentication token'
      }
    },
    required: ['x-user-id', 'x-secret-token']
  },
  params: {
    type: 'object',
    properties: {
      friendId: {
        type: 'string',
        description: 'ID of the user to check friendship with'
      }
    },
    required: ['friendId']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            areFriends: {
              type: 'boolean',
              description: 'Whether the users are friends'
            }
          }
        }
      },
      description: 'Friendship status verified successfully'
    },
    401: {
      ...errorResponse,
      description: 'Unauthorized - invalid secret token'
    },
    400: {
      ...errorResponse,
      description: 'Invalid user IDs'
    }
  }
};
