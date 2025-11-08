import { FastifySchema } from 'fastify';

export const sendMessageSchema: FastifySchema = {
  description: 'Send a message in a chat',
  tags: ['Message'],
  body: {
    type: 'object',
    required: ['chatId', 'content'],
    properties: {
      chatId: { type: 'number', description: 'Chat ID' },
      content: { type: 'string', description: 'Message content' }
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
            content: { type: 'string' }
          }
        }
      }
    }
  }
};

export const editMessageSchema: FastifySchema = {
  description: 'Edit a message',
  tags: ['Message'],
  params: {
    type: 'object',
    required: ['messageId'],
    properties: {
      messageId: { type: 'string', description: 'Message ID' }
    }
  },
  body: {
    type: 'object',
    required: ['content'],
    properties: {
      content: { type: 'string', description: 'New message content' }
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
            messageId: { type: 'number' },
            content: { type: 'string' }
          }
        }
      }
    }
  }
};

export const deleteMessageSchema: FastifySchema = {
  description: 'Delete a message',
  tags: ['Message'],
  params: {
    type: 'object',
    required: ['messageId'],
    properties: {
      messageId: { type: 'string', description: 'Message ID' }
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
            messageId: { type: 'number' }
          }
        }
      }
    }
  }
};

export const replyToMessageSchema: FastifySchema = {
  description: 'Reply to a message',
  tags: ['Message'],
  params: {
    type: 'object',
    required: ['messageId'],
    properties: {
      messageId: { type: 'string', description: 'Original message ID' }
    }
  },
  body: {
    type: 'object',
    required: ['content'],
    properties: {
      content: { type: 'string', description: 'Reply content' }
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
            replyMessage: { type: 'object' }
          }
        }
      }
    }
  }
};

export const addReactionSchema: FastifySchema = {
  description: 'Add or update a reaction to a message',
  tags: ['Message'],
  params: {
    type: 'object',
    required: ['messageId'],
    properties: {
      messageId: { type: 'string', description: 'Message ID' }
    }
  },
  body: {
    type: 'object',
    required: ['emoji'],
    properties: {
      emoji: { 
        type: 'string', 
        enum: ['LIKE', 'LOVE', 'LAUGH', 'SAD', 'ANGRY', 'WOW', 'FUCK'],
        description: 'Reaction emoji type' 
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
            emoji: { type: 'string' }
          }
        }
      }
    }
  }
};

export const removeReactionSchema: FastifySchema = {
  description: 'Remove a reaction from a message',
  tags: ['Message'],
  params: {
    type: 'object',
    required: ['messageId'],
    properties: {
      messageId: { type: 'string', description: 'Message ID' }
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
            messageId: { type: 'number' }
          }
        }
      }
    }
  }
};
