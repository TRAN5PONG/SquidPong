import { FastifySchema } from 'fastify';

// =============================================
// BLOCKING SYSTEM SCHEMAS
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

// Profile object schema (simplified for blocked users)
const blockedProfileSchema = {
  type: 'object',
  properties: {
    userId: { type: 'number' },
    username: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    avatar: { type: 'string' },
    status: { 
      type: 'string',
      enum: ['ONLINE', 'OFFLINE', 'DO_NOT_DISTURB']
    },
    isVerified: { type: 'boolean' }
  }
};

// =============================================
// BLOCK USER SCHEMAS
// =============================================

export const blockUserSchema: FastifySchema = {
  description: 'Block a user (must be friends first)',
  tags: ['Blocking System'],
  summary: 'Block User',
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
      blockId: {
        type: 'string',
        description: 'ID of the user to block'
      }
    },
    required: ['blockId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'User blocked successfully'
    },
    400: {
      ...errorResponse,
      description: 'Cannot block user - not friends or invalid ID'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

// =============================================
// UNBLOCK USER SCHEMAS
// =============================================

export const unblockUserSchema: FastifySchema = {
  description: 'Unblock a previously blocked user',
  tags: ['Blocking System'],
  summary: 'Unblock User',
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
      blockId: {
        type: 'string',
        description: 'ID of the user to unblock'
      }
    },
    required: ['blockId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'User unblocked successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid user ID'
    },
    404: {
      ...errorResponse,
      description: 'Blocked relationship not found'
    }
  }
};

// =============================================
// GET BLOCKED USERS SCHEMAS
// =============================================

export const getBlockedUsersSchema: FastifySchema = {
  description: 'Get list of all blocked users',
  tags: ['Blocking System'],
  summary: 'Get Blocked Users',
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
          items: blockedProfileSchema,
          description: 'List of blocked users'
        }
      },
      description: 'Blocked users list retrieved successfully'
    },
    500: {
      ...errorResponse,
      description: 'Internal server error'
    }
  }
};
