import { FastifySchema } from 'fastify';

// =============================================
// POLL & REACTION SCHEMAS
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

// Poll option schema
const pollOptionSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    text: { type: 'string' },
    votes: { type: 'number' },
    pollId: { type: 'number' }
  }
};

// Poll schema
const pollSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    question: { type: 'string' },
    groupId: { type: 'number' },
    createdBy: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    isAnonymous: { type: 'boolean' },
    allowMultiple: { type: 'boolean' },
    options: {
      type: 'array',
      items: pollOptionSchema
    },
    creator: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' }
      }
    }
  }
};

// Reaction schema
const reactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    emoji: { type: 'string' },
    messageId: { type: 'number' },
    userId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    user: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' }
      }
    }
  }
};

// =============================================
// POLL MANAGEMENT SCHEMAS
// =============================================

export const createPollSchema: FastifySchema = {
  description: 'Create a poll in a group chat',
  tags: ['Polls'],
  summary: 'Create Poll',
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
      groupId: {
        type: 'string',
        description: 'Group ID where poll will be created'
      }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        minLength: 1,
        maxLength: 300,
        description: 'Poll question'
      },
      options: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        minItems: 2,
        maxItems: 10,
        description: 'Poll options (2-10 options)'
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        description: 'Poll expiration date (optional)'
      },
      isAnonymous: {
        type: 'boolean',
        description: 'Whether poll votes are anonymous (default: false)'
      },
      allowMultiple: {
        type: 'boolean',
        description: 'Whether multiple options can be selected (default: false)'
      }
    },
    required: ['question', 'options'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: pollSchema
      },
      description: 'Poll created successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid input data'
    },
    403: {
      ...errorResponse,
      description: 'Not a member of this group'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

export const getGroupPollsSchema: FastifySchema = {
  description: 'Get all polls in a group',
  tags: ['Polls'],
  summary: 'Get Group Polls',
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
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  querystring: {
    type: 'object',
    properties: {
      active: {
        type: 'string',
        enum: ['true', 'false'],
        description: 'Filter by active polls only'
      },
      page: {
        type: 'string',
        description: 'Page number (default: 1)'
      },
      limit: {
        type: 'string',
        description: 'Polls per page (default: 10)'
      }
    }
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
            polls: {
              type: 'array',
              items: pollSchema
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      },
      description: 'Group polls retrieved successfully'
    },
    403: {
      ...errorResponse,
      description: 'Not a member of this group'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

export const getPollByIdSchema: FastifySchema = {
  description: 'Get poll by ID with detailed results',
  tags: ['Polls'],
  summary: 'Get Poll by ID',
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
      pollId: {
        type: 'string',
        description: 'Poll ID'
      }
    },
    required: ['pollId']
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
            ...pollSchema.properties,
            userVotes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  optionId: { type: 'number' },
                  userId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              },
              description: 'Current user votes (if not anonymous)'
            },
            totalVotes: {
              type: 'number',
              description: 'Total number of votes cast'
            }
          }
        }
      },
      description: 'Poll retrieved successfully'
    },
    403: {
      ...errorResponse,
      description: 'Not authorized to view this poll'
    },
    404: {
      ...errorResponse,
      description: 'Poll not found'
    }
  }
};

export const votePollOptionSchema: FastifySchema = {
  description: 'Vote on poll option',
  tags: ['Polls'],
  summary: 'Vote on Poll',
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
      pollId: {
        type: 'string',
        description: 'Poll ID'
      }
    },
    required: ['pollId']
  },
  body: {
    type: 'object',
    properties: {
      optionIds: {
        type: 'array',
        items: {
          type: 'number'
        },
        minItems: 1,
        description: 'Array of option IDs to vote for'
      }
    },
    required: ['optionIds'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Vote cast successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid vote options or poll expired'
    },
    403: {
      ...errorResponse,
      description: 'Not authorized to vote on this poll'
    },
    404: {
      ...errorResponse,
      description: 'Poll not found'
    }
  }
};

export const removePollSchema: FastifySchema = {
  description: 'Remove poll (creator or group admin only)',
  tags: ['Polls'],
  summary: 'Remove Poll',
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
      pollId: {
        type: 'string',
        description: 'Poll ID to remove'
      }
    },
    required: ['pollId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Poll removed successfully'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions'
    },
    404: {
      ...errorResponse,
      description: 'Poll not found'
    }
  }
};

// =============================================
// REACTION SCHEMAS
// =============================================

export const getReactionsForMessageSchema: FastifySchema = {
  description: 'Get all reactions for a specific message',
  tags: ['Reactions'],
  summary: 'Get Message Reactions',
  params: {
    type: 'object',
    properties: {
      messageId: {
        type: 'string',
        description: 'Message ID'
      }
    },
    required: ['messageId']
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
            reactions: {
              type: 'array',
              items: reactionSchema
            },
            summary: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  count: { type: 'number' },
                  users: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string' },
                        username: { type: 'string' }
                      }
                    }
                  }
                }
              },
              description: 'Reaction summary grouped by emoji'
            }
          }
        }
      },
      description: 'Message reactions retrieved successfully'
    },
    404: {
      ...errorResponse,
      description: 'Message not found'
    }
  }
};

export const addReactionSchema: FastifySchema = {
  description: 'Add reaction to a message',
  tags: ['Reactions'],
  summary: 'Add Reaction',
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
      messageId: {
        type: 'string',
        description: 'Message ID'
      }
    },
    required: ['messageId']
  },
  body: {
    type: 'object',
    properties: {
      emoji: {
        type: 'string',
        minLength: 1,
        maxLength: 10,
        description: 'Emoji to react with'
      }
    },
    required: ['emoji'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: reactionSchema
      },
      description: 'Reaction added successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid emoji or reaction already exists'
    },
    403: {
      ...errorResponse,
      description: 'Not authorized to react to this message'
    },
    404: {
      ...errorResponse,
      description: 'Message not found'
    }
  }
};

export const removeReactionSchema: FastifySchema = {
  description: 'Remove reaction from a message',
  tags: ['Reactions'],
  summary: 'Remove Reaction',
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
      messageId: {
        type: 'string',
        description: 'Message ID'
      },
      emoji: {
        type: 'string',
        description: 'Emoji to remove'
      }
    },
    required: ['messageId', 'emoji']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Reaction removed successfully'
    },
    404: {
      ...errorResponse,
      description: 'Message or reaction not found'
    }
  }
};

