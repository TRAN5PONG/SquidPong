import { FastifySchema } from 'fastify';

// =============================================
// CHAT SERVICE SCHEMAS - Complete API Documentation
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

// User object schema for chat
const chatUserSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    userId: { type: 'string' },
    username: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    avatar: { type: 'string' },
    isVerified: { type: 'boolean' }
  }
};

// Message object schema
const messageSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    content: { type: 'string' },
    type: { 
      type: 'string',
      enum: ['TEXT', 'IMAGE', 'FILE', 'VOICE', 'VIDEO']
    },
    senderId: { type: 'string' },
    chatId: { type: 'number' },
    timestamp: { type: 'string', format: 'date-time' },
    isEdited: { type: 'boolean' },
    replyToId: { type: 'number', nullable: true },
    sender: chatUserSchema
  }
};

// Chat object schema
const chatSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    type: { 
      type: 'string',
      enum: ['PRIVATE', 'GROUP']
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    members: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          userId: { type: 'string' },
          chatId: { type: 'number' },
          joinedAt: { type: 'string', format: 'date-time' },
          user: chatUserSchema
        }
      }
    },
    messages: {
      type: 'array',
      items: messageSchema
    }
  }
};

// =============================================
// USER MANAGEMENT SCHEMAS (Internal)
// =============================================

export const createUserSchema: FastifySchema = {
  description: 'Create user in chat service (internal service call)',
  tags: ['User Management'],
  summary: 'Create Chat User',
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
    required: ['userId', 'username', 'firstName', 'lastName', 'avatar', 'isVerified'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'User created in chat service'
    },
    400: {
      ...errorResponse,
      description: 'User already exists or invalid data'
    },
    401: {
      ...errorResponse,
      description: 'Unauthorized - invalid secret token'
    }
  }
};

export const updateUserSchema: FastifySchema = {
  description: 'Update user in chat service (internal service call)',
  tags: ['User Management'],
  summary: 'Update Chat User',
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
      }
    },
    required: ['userId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'User updated in chat service'
    },
    400: {
      ...errorResponse,
      description: 'Invalid data'
    },
    401: {
      ...errorResponse,
      description: 'Unauthorized - invalid secret token'
    }
  }
};

export const deleteUserSchema: FastifySchema = {
  description: 'Delete user from chat service (internal service call)',
  tags: ['User Management'],
  summary: 'Delete Chat User',
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
      description: 'User deleted from chat service'
    },
    400: {
      ...errorResponse,
      description: 'User not found'
    },
    401: {
      ...errorResponse,
      description: 'Unauthorized - invalid secret token'
    }
  }
};

// =============================================
// PRIVATE CHAT SCHEMAS
// =============================================

export const createChatSchema: FastifySchema = {
  description: 'Create or get existing private chat between two users',
  tags: ['Private Chat'],
  summary: 'Create Private Chat',
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
      friendId: {
        type: 'string',
        description: 'ID of the friend to chat with'
      }
    },
    required: ['friendId'],
    additionalProperties: false
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
            chatId: {
              type: 'number',
              description: 'ID of the created or existing chat'
            }
          }
        }
      },
      description: 'Chat created or retrieved successfully'
    },
    400: {
      ...errorResponse,
      description: 'Cannot chat with yourself or friendship required'
    },
    403: {
      ...errorResponse,
      description: 'Not friends with this user'
    }
  }
};

export const removeChatSchema: FastifySchema = {
  description: 'Remove private chat between two users',
  tags: ['Private Chat'],
  summary: 'Remove Private Chat',
  params: {
    type: 'object',
    properties: {
      chatId: {
        type: 'string',
        description: 'ID of the chat to remove'
      }
    },
    required: ['chatId']
  },
  querystring: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'Current user ID'
      },
      friendId: {
        type: 'string',
        description: 'Friend user ID'
      }
    },
    required: ['userId', 'friendId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Chat removed successfully'
    },
    404: {
      ...errorResponse,
      description: 'Chat not found'
    }
  }
};

export const getChatByIdSchema: FastifySchema = {
  description: 'Get chat messages by chat ID',
  tags: ['Private Chat'],
  summary: 'Get Chat Messages',
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
      chatId: {
        type: 'string',
        description: 'ID of the chat to retrieve'
      }
    },
    required: ['chatId']
  },

};

export const getRecentChatsSchema: FastifySchema = {
  description: 'Get recent chats with last message for current user',
  tags: ['Private Chat'],
  summary: 'Get Recent Chats',
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
  querystring: {
    type: 'object',
    properties: {
      limit: {
        type: 'string',
        description: 'Maximum number of chats to return (default: 10)'
      }
    }
  },
  
};
