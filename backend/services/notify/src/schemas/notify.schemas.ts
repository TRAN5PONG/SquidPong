import { FastifySchema } from 'fastify';

// =============================================
// NOTIFICATION SERVICE SCHEMAS
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

// Notification object schema
const notificationSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    type: { 
      type: 'string',
      enum: ['FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'MESSAGE', 'GAME_INVITE', 'TOURNAMENT_INVITE', 'SYSTEM']
    },
    isRead: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    by: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isVerified: { type: 'boolean' },
        avatar: { type: 'string' },
        status: { type: 'string' },
        customStatus: { type: 'string', nullable: true }
      }
    },
    payload: { type: 'object', nullable: true }
  }
};

// =============================================
// NOTIFICATION MANAGEMENT SCHEMAS
// =============================================

export const getNotificationHistorySchema: FastifySchema = {

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
          items: notificationSchema
        }
      },
      description: 'Notifications fetched successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid request'
    }
  }
};

export const markNotificationAsReadSchema: FastifySchema = {

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
      notifyId: {
        type: 'string',
        description: 'ID of the notification to mark as read'
      }
    },
    required: ['notifyId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Notification marked as read successfully'
    },
    400: {
      ...errorResponse,
      description: 'Notification not found'
    }
  }
};

export const markNotificationAsReadAllSchema: FastifySchema = {

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
      description: 'All notifications marked as read successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid request'
    }
  }
};

export const deleteNotificationSchema: FastifySchema = {

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
      notifyId: {
        type: 'string',
        description: 'ID of the notification to delete'
      }
    },
    required: ['notifyId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Notification deleted successfully'
    },
    400: {
      ...errorResponse,
      description: 'Notification not found'
    }
  }
};

export const deleteAllNotificationsSchema: FastifySchema = {

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
      description: 'All notifications deleted successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid request'
    }
  }
};

// =============================================
// USER MANAGEMENT SCHEMAS (Internal)
// =============================================

export const createUserNotifySchema: FastifySchema = {

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
        type: 'string',
        description: 'User ID from auth service'
      },
      username: {
        type: 'string',
        description: 'Username'
      },
      firstName: {
        type: 'string',
        description: 'First name'
      },
      lastName: {
        type: 'string',
        description: 'Last name'
      },
      avatar: {
        type: 'string',
        description: 'Avatar URL'
      },
      isVerified: {
        type: 'boolean',
        description: 'Whether user is verified'
      }
    },
    required: ['userId', 'username', 'firstName', 'lastName'],
    additionalProperties: true
  },
  response: {
    200: {
      ...successResponse,
      description: 'User created in notify service'
    },
    400: {
      ...errorResponse,
      description: 'User already exists or invalid data'
    }
  }
};

export const updateUserNotifySchema: FastifySchema = {

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
        type: 'string',
        description: 'User ID to update'
      },
      username: {
        type: 'string',
        description: 'New username'
      },
      firstName: {
        type: 'string',
        description: 'New first name'
      },
      lastName: {
        type: 'string',
        description: 'New last name'
      },
      avatar: {
        type: 'string',
        description: 'New avatar URL'
      },
      isVerified: {
        type: 'boolean',
        description: 'New verification status'
      },
      status: {
        type: 'string',
        enum: ['ONLINE', 'OFFLINE', 'AWAY', 'IN_GAME'],
        description: 'User status'
      },
      customStatus: {
        type: 'string',
        description: 'Custom status message'
      },
      notificationSettings: {
        type: 'object',
        description: 'Notification preferences'
      }
    },
    additionalProperties: true
  },
  response: {
    200: {
      ...successResponse,
      description: 'User updated in notify service'
    },
    400: {
      ...errorResponse,
      description: 'Invalid data'
    }
  }
};

export const deleteUserNotifySchema: FastifySchema = {

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
        type: 'string',
        description: 'User ID to delete'
      }
    },
    required: ['userId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'User deleted from notify service'
    },
    400: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};
