import { FastifySchema } from 'fastify';

// =============================================
// USER SERVICE SCHEMAS - Complete API Documentation
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

// Profile object schema
const profileSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    userId: { type: 'number' },
    username: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    avatar: { type: 'string' },
    bio: { type: 'string', nullable: true },
    location: { type: 'string', nullable: true },
    status: { 
      type: 'string',
      enum: ['ONLINE', 'OFFLINE', 'AWAY', 'BUSY']
    },
    isVerified: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    preferences: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        profileId: { type: 'number' },
        language: { type: 'string' },
        timezone: { type: 'string' },
        theme: { type: 'string' },
        notifications: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            preferenceId: { type: 'number' },
            email: { type: 'boolean' },
            push: { type: 'boolean' },
            sms: { type: 'boolean' },
            friendRequests: { type: 'boolean' },
            gameInvitations: { type: 'boolean' },
            messages: { type: 'boolean' }
          }
        }
      }
    }
  }
};

// =============================================
// PROFILE MANAGEMENT SCHEMAS
// =============================================

export const createProfileSchema: FastifySchema = {
  description: 'Create user profile (internal service call)',
  tags: ['Profile Management'],
  summary: 'Create Profile',
  headers: {
    type: 'object',
    properties: {
      'X-Secret-Token': {
        type: 'string',
        description: 'Internal service authentication token'
      }
    },
    required: ['X-Secret-Token']
  },
  body: {
    type: 'object',
    properties: {
      userId: {
        type: 'number',
        description: 'User ID from auth service'
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        description: 'Username'
      },
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        description: 'First name'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        description: 'Last name'
      },
      avatar: {
        type: 'string',
        description: 'Avatar image filename (optional)'
      }
    },
    required: ['userId', 'username', 'firstName', 'lastName'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Profile created successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid input data'
    },
    401: {
      ...errorResponse,
      description: 'Unauthorized - invalid secret token'
    }
  }
};

export const updateProfileLiveSchema: FastifySchema = {
  description: 'Update user profile in real-time (Redis cache)',
  tags: ['Profile Management'],
  summary: 'Update Profile (Live)',
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
  consumes: ['multipart/form-data'],
  body: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        description: 'Username'
      },
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        description: 'First name'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        description: 'Last name'
      },
      bio: {
        type: 'string',
        maxLength: 500,
        description: 'User biography'
      },
      location: {
        type: 'string',
        maxLength: 100,
        description: 'User location'
      },
      avatar: {
        type: 'string',
        description: 'Avatar image file'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: profileSchema
      },
      description: 'Profile updated successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid input data'
    },
    404: {
      ...errorResponse,
      description: 'Profile not found'
    }
  }
};

export const updateProfileDBSchema: FastifySchema = {
  description: 'Sync profile from Redis to database (internal call)',
  tags: ['Profile Management'],
  summary: 'Sync Profile to Database',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      },
      'X-Secret-Token': {
        type: 'string',
        description: 'Internal service authentication token'
      }
    },
    required: ['x-user-id', 'X-Secret-Token']
  },
  body: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['ONLINE', 'OFFLINE'],
        description: 'User status update'
      }
    },
    required: ['status'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Profile synced successfully'
    },
    401: {
      ...errorResponse,
      description: 'Unauthorized'
    }
  }
};

export const getCurrentUserSchema: FastifySchema = {
  description: 'Get current user profile',
  tags: ['Profile Management'],
  summary: 'Get Current User Profile',
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
        data: profileSchema
      },
      description: 'Profile retrieved successfully'
    },
    404: {
      ...errorResponse,
      description: 'Profile not found'
    }
  }
};

export const getUserByIdSchema: FastifySchema = {
  description: 'Get user profile by ID',
  tags: ['Profile Management'],
  summary: 'Get User by ID',
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'User ID'
      }
    },
    required: ['id']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: profileSchema
      },
      description: 'Profile retrieved successfully'
    },
    404: {
      ...errorResponse,
      description: 'Profile not found'
    }
  }
};

export const getAllUsersSchema: FastifySchema = {
  description: 'Get all users with online/offline status',
  tags: ['Profile Management'],
  summary: 'Get All Users',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: profileSchema
        }
      },
      description: 'Users retrieved successfully'
    },
    500: {
      ...errorResponse,
      description: 'Internal server error'
    }
  }
};

export const searchUsersSchema: FastifySchema = {
  description: 'Search users by username or first name',
  tags: ['Profile Management'],
  summary: 'Search Users',
  querystring: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 1,
        description: 'Search query for username or first name'
      }
    },
    required: ['query']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: profileSchema
        }
      },
      description: 'Search results retrieved successfully'
    },
    400: {
      ...errorResponse,
      description: 'Query parameter is required'
    }
  }
};

export const deleteProfileSchema: FastifySchema = {
  description: 'Delete user profile (internal service call)',
  tags: ['Profile Management'],
  summary: 'Delete Profile',
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
      ...successResponse,
      description: 'Profile deleted successfully'
    },
    404: {
      ...errorResponse,
      description: 'Profile not found'
    }
  }
};
