import { FastifySchema } from 'fastify';

// =============================================
// TWO-FACTOR AUTHENTICATION SCHEMAS
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

// =============================================
// 2FA SETUP SCHEMAS
// =============================================

export const setup2FASchema: FastifySchema = {
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
      method: {
        type: 'string',
        enum: ['authenticator', 'email'],
        description: 'Two-factor authentication method'
      }
    },
    required: ['method']
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
            twoFAQRCode: {
              type: 'string',
              description: 'QR code for authenticator app (only for authenticator method)'
            },
            twoFAKey: {
              type: 'string',
              description: 'Secret key for manual entry (only for authenticator method)'
            }
          },
          nullable: true
        }
      },
      description: '2FA setup successful'
    },
    400: {
      ...errorResponse,
      description: '2FA already enabled or invalid method'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

// =============================================
// 2FA ENABLE SCHEMAS
// =============================================

export const enable2FASchema: FastifySchema = {
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
      method: {
        type: 'string',
        enum: ['authenticator', 'email'],
        description: 'Two-factor authentication method'
      }
    },
    required: ['method']
  },
  body: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        description: '6-digit verification code from authenticator app or email'
      }
    },
    required: ['code'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: '2FA enabled successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid code or 2FA already enabled'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

// =============================================
// 2FA VERIFY SCHEMAS
// =============================================

export const verify2FASchema: FastifySchema = {
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
      method: {
        type: 'string',
        enum: ['authenticator', 'email'],
        description: 'Two-factor authentication method'
      }
    },
    required: ['method']
  },
  body: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        description: '6-digit verification code from authenticator app or email'
      }
    },
    required: ['code'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: '2FA verification successful'
    },
    400: {
      ...errorResponse,
      description: 'Invalid code or 2FA not enabled'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

// =============================================
// 2FA DISABLE SCHEMAS
// =============================================

export const disable2FASchema: FastifySchema = {
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
      method: {
        type: 'string',
        enum: ['authenticator', 'email'],
        description: 'Two-factor authentication method'
      }
    },
    required: ['method']
  },
  response: {
    200: {
      ...successResponse,
      description: '2FA disabled successfully'
    },
    400: {
      ...errorResponse,
      description: '2FA not enabled'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

// =============================================
// 2FA STATUS SCHEMAS
// =============================================

export const status2FASchema: FastifySchema = {
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
      method: {
        type: 'string',
        enum: ['authenticator', 'email'],
        description: 'Two-factor authentication method'
      }
    },
    required: ['method']
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
            twoFAMethod: {
              type: 'string',
              enum: ['authenticator', 'email', 'none'],
              description: 'Current 2FA method enabled'
            }
          }
        }
      },
      description: '2FA status retrieved successfully'
    },
    400: {
      ...errorResponse,
      description: '2FA not enabled'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};
