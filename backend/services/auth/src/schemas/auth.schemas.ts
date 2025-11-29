import { FastifySchema } from 'fastify';

// // =============================================
// // AUTH SERVICE SCHEMAS - Complete API Documentation
// // =============================================

// // Common response schemas
const successResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  data: {}
  },
  required: ['success', 'message']
};

const errorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
  required: ['success', 'message']
};

// // =============================================
// // USER REGISTRATION & LOGIN SCHEMAS
// // =============================================

export const signupSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        minLength: 6,
        description: 'User password (minimum 6 characters)'
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
        description: 'Unique username (3-30 characters, alphanumeric and underscore only)'
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
      }
    },
    required: ['email', 'password', 'username', 'firstName', 'lastName'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Registration successful, verification email sent'
    },
    400: {
      ...errorResponse,
      description: 'Invalid input data or user already exists'
    },
  }
};


export const loginSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
        description: 'Username (3-30 characters, alphanumeric and underscore only)'
      },
      password: {
        type: 'string',
        description: 'User password'
      }
    },
    required: ['password'],
    additionalProperties: false,
    anyOf: [
      {
        required: ['email']
      },
      {
        required: ['username']
      }
    ]
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {}
      },
      description: 'Login successful'
    },
    400: {
      ...errorResponse,
      description: 'Invalid credentials or account not verified'
    },
    401: {
      ...errorResponse,
      description: 'Authentication failed'
    }
  }
};

export const logoutSchema: FastifySchema = {
  response: {
    200: {
      ...successResponse,
      description: 'Logout successful'
    },
    500: {
      ...errorResponse,
      description: 'Logout failed'
    }
  }
};

// =============================================
// EMAIL VERIFICATION SCHEMAS
// =============================================

export const verifyEmailSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Email address to verify'
      },
      code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        minLength: 6,
        maxLength: 6,
        description: '6-digit verification code'
      }
    },
    required: ['email', 'code'],
    additionalProperties: false
  },
  response: { 
    200: {
      ...successResponse,
      description: 'Email verified successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid or expired verification code'
    }
  }
};

// =============================================
// PASSWORD MANAGEMENT SCHEMAS
// =============================================

export const forgotPasswordSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
        description: 'Username (3-30 characters, alphanumeric and underscore only)'
      }
    },
    additionalProperties: false,
    anyOf: [
      {
        required: ['email']
      },
      {
        required: ['username']
      }
    ]
  },
  response: {
    200: {
      ...successResponse,
      description: 'Password reset email sent'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

export const resetPasswordSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
        description: 'Username (3-30 characters, alphanumeric and underscore only)'
      },
      code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        minLength: 6,
        maxLength: 6,
        description: '6-digit reset code from email'
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        description: 'New password (minimum 6 characters)'
      }
    },
    required: ['code', 'newPassword'],
    additionalProperties: false,
    anyOf: [
      {
        required: ['email']
      },
      {
        required: ['username']
      }
    ]
  },
  response: {
    200: {
      ...successResponse,
      description: 'Password reset successful'
    },
    400: {
      ...errorResponse,
      description: 'Invalid code or password mismatch'
    }
  }
};

export const changePasswordSchema: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    }
  },
  body: {
    type: 'object',
    properties: {
      oldPassword: {
        type: 'string',
        description: 'Current password'
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        description: 'New password (minimum 6 characters)'
      }
    },
    required: ['oldPassword', 'newPassword'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Password changed successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid old password'
    }
  }
};

// =============================================
// TOKEN MANAGEMENT SCHEMAS
// =============================================

export const refreshTokenSchema: FastifySchema = {
  response: {
    200: {
      ...successResponse,
      description: 'Token refreshed successfully'
    },
    401: {
      ...errorResponse,
      description: 'Invalid or expired refresh token'
    }
  }
};

// =============================================
// ACCOUNT MANAGEMENT SCHEMAS
// =============================================

export const deleteAccountSchema: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    }
  },
  response: {
    200: {
      ...successResponse,
      description: 'Account deleted successfully'
    },
    404: {
      ...errorResponse,
      description: 'User not found'
    }
  }
};

// =============================================
// OAUTH SCHEMAS
// =============================================

export const googleCallbackSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Authorization code from Google'
      },
      state: {
        type: 'string',
        description: 'State parameter for security'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {}
      },
      description: 'OAuth login successful'
    },
    400: {
      ...errorResponse,
      description: 'OAuth authentication failed'
    }
  }
};

export const intraSchema: FastifySchema = {
  response: {
    302: {
      description: 'Redirect to Intra42 authorization page'
    }
  }
};

export const intraCallbackSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Authorization code from Intra42'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {}
      },
      description: 'OAuth login successful'
    },
    400: {
      ...errorResponse,
      description: 'OAuth authentication failed'
    }
  }
};
