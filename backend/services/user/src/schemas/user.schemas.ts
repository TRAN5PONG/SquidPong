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


// PROFILE MANAGEMENT SCHEMAS
// =============================================

export const createProfileSchema: FastifySchema = {
  description: 'Create user profile (internal service call)',
  tags: ['Profile Management'],
  summary: 'Create Profile',
  headers: {
    type: 'object',
    properties: {
      'x-secret-token': {
        type: 'string',
        description: 'Internal service authentication token'
      }
    },
    required: ['x-secret-token']
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
        data: {}
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

export const updateProfileIntraSchema: FastifySchema = {
  description: 'Update user profile from Intra (accepts multipart image)',
  tags: ['Profile Management'],
  summary: 'Update Profile (Intra)',
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
      username: { type: 'string', minLength: 3, maxLength: 30, description: 'Username' },
      firstName: { type: 'string', minLength: 1, maxLength: 50, description: 'First name' },
      lastName: { type: 'string', minLength: 1, maxLength: 50, description: 'Last name' },
      avatar: { type: 'string', description: 'Avatar image file' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
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
      'x-secret-token': {
        type: 'string',
        description: 'Internal service authentication token'
      }
    },
    required: ['x-user-id', 'x-secret-token']
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
        data: {}
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
        pattern: '^[0-9]+$',
        description: 'User ID (digits only)'
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
        data: {}
      },
      description: 'Profile retrieved successfully'
    },
    404: {
      ...errorResponse,
      description: 'Profile not found'
    }
  }
};


export const getUserByUserNameSchema: FastifySchema = {
  description: 'Get user profile by ID',
  tags: ['Profile Management'],
  summary: 'Get User by ID',
  params: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'User ID (digits only)'
      }
    },
    required: ['username']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {}
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
          items: {}
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
          items: {}
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

// PURCHASE SCHEMAS
// =============================================

export const purchaseItemSchema: FastifySchema = {
  description: 'Purchase character or paddle with wallet balance',
  tags: ['Shop'],
  summary: 'Purchase Item',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID for authentication'
      }
    },
    required: ['x-user-id']
  },
  body: {
    type: 'object',
    properties: {
      itemType: {
        type: 'string',
        enum: ['character', 'paddle'],
        description: 'Type of item to purchase'
      },
      itemName: {
        type: 'string',
        description: 'Name of the item to purchase (e.g., "Taizen", "Survivor")'
      }
    },
    required: ['itemType', 'itemName']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Item purchased successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid item type or name'
    },
    402: {
      ...errorResponse,
      description: 'Insufficient wallet balance'
    },
    409: {
      ...errorResponse,
      description: 'Item already owned'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

export const getShopItemsSchema: FastifySchema = {
  description: 'Get available shop items and user ownership status',
  tags: ['Shop'],
  summary: 'Get Shop Items',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID for authentication'
      }
    },
    required: ['x-user-id']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Shop items retrieved successfully'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};
