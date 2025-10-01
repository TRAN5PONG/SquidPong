import { FastifySchema } from 'fastify';

// =============== USER SCHEMAS ===============

export const createUserSchema: FastifySchema = {
  tags: ['Chat - User Management'],
  summary: 'Create user in chat service',
  description: 'Internal endpoint to create/ensure user exists in chat service',
  headers: {
    type: "object",
    properties: {
      'x-secret-token': { type: "string", description: "Internal service secret token" }
    },
    required: ["x-secret-token"]
  },
  body: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User ID from user service" },
      username: { type: "string", minLength: 1, maxLength: 50 },
      firstName: { type: "string", minLength: 1, maxLength: 100 },
      lastName: { type: "string", minLength: 1, maxLength: 100 },
      avatar: { type: "string", format: "uri" },
      isVerified: { type: "boolean" }
    },
    required: ["userId", "username", "firstName", "lastName"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    401: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const updateUserSchema: FastifySchema = {
  tags: ['Chat - User Management'],
  summary: 'Update user in chat service',
  description: 'Internal endpoint to update user information in chat service',
  headers: {
    type: "object",
    properties: {
      'x-secret-token': { type: "string", description: "Internal service secret token" }
    },
    required: ["x-secret-token"]
  },
  body: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User ID from user service" },
      username: { type: "string", minLength: 1, maxLength: 50 },
      firstName: { type: "string", minLength: 1, maxLength: 100 },
      lastName: { type: "string", minLength: 1, maxLength: 100 },
      avatar: { type: "string", format: "uri" },
      isVerified: { type: "boolean" }
    },
    required: ["userId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};


export const deleteUserSchema: FastifySchema = {
  tags: ['Chat - User Management'],
  summary: 'Delete user from chat service',
  description: 'Internal endpoint to delete user from chat service',
  headers: {
    type: "object",
    properties: {
      'x-secret-token': { type: "string", description: "Internal service secret token" }
    },
    required: ["x-secret-token"]
  },
  body: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User ID to delete" }
    },
    required: ["userId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};


// =============== CHAT SCHEMAS ===============

export const createChatSchema: FastifySchema = {
  tags: ['Chat - Direct Messages'],
  summary: 'Create or get existing chat',
  description: 'Create a new direct chat between two users or return existing chat ID',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  body: {
    type: "object",
    properties: {
      friendId: { type: "string", description: "ID of the friend to chat with" }
    },
    required: ["friendId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            chatId: { type: "number" }
          }
        }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const removeChatSchema: FastifySchema = {
  tags: ['Chat - Direct Messages'],
  summary: 'Delete a chat',
  description: 'Delete a direct chat between two users',
  params: {
    type: "object",
    properties: {
      chatId: { type: "string", pattern: "^[0-9]+$", description: "Chat ID to delete" }
    },
    required: ["chatId"]
  },
  querystring: {
    type: "object",
    properties: {
      userId: { type: "string", description: "Current user ID" },
      friendId: { type: "string", description: "Friend user ID" }
    },
    required: ["userId", "friendId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const getChatByIdSchema: FastifySchema = {
  tags: ['Chat - Direct Messages'],
  summary: 'Get chat messages',
  description: 'Retrieve all messages from a specific chat',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      chatId: { type: "string", pattern: "^[0-9]+$", description: "Chat ID" }
    },
    required: ["chatId"]
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            id: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  userId: { type: "string" },
                  chatId: { type: "number" },
                  joinedAt: { type: "string", format: "date-time" }
                }
              }
            },
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  content: { type: "string" },
                  senderId: { type: "string" },
                  chatId: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" }
                }
              }
            }
          }
        }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const getRecentChatsSchema: FastifySchema = {
  tags: ['Chat - Recent Conversations'],
  summary: 'Get recent chats',
  description: 'Get the most recent chats (both private and group) for the current user',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  querystring: {
    type: "object",
    properties: {
      limit: { 
        type: "string", 
        pattern: "^[0-9]+$", 
        description: "Maximum number of recent chats to return (default: 10)" 
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            recentChats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  chatId: { type: "number" },
                  type: { type: "string", enum: ["PRIVATE", "GROUP"] },
                  user: {
                    type: "object",
                    properties: {
                      userId: { type: "string" },
                      username: { type: "string" },
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      avatar: { type: "string" },
                      isVerified: { type: "boolean" }
                    }
                  },
                  group: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      name: { type: "string" },
                      desc: { type: "string" },
                      imageUrl: { type: "string" },
                      type: { type: "string", enum: ["PUBLIC", "PRIVATE"] }
                    }
                  },
                  lastMessage: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      content: { type: "string" },
                      type: { type: "string", enum: ["TEXT", "URL", "POLL", "IMAGE"] },
                      sender: {
                        type: "object",
                        properties: {
                          userId: { type: "string" },
                          username: { type: "string" },
                          firstName: { type: "string" },
                          lastName: { type: "string" },
                          avatar: { type: "string" }
                        }
                      },
                      timestamp: { type: "string", format: "date-time" },
                      isEdited: { type: "boolean" }
                    }
                  },
                  createdAt: { type: "string", format: "date-time" }
                }
              }
            },
            total: { type: "number" }
          }
        }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    401: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};
