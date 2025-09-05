
export const signupSchema = {
  tags: ['Authentication'],
  summary: 'User signup',
  description: 'Register a new user account and send verification email',
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
      fname: {
        type: 'string',
        description: 'First name'
      },
      lname: {
        type: 'string',
        description: 'Last name'
      },
      username: {
        type: 'string',
        description: 'Username'
      }
    },
    required: ['email', 'password', 'fname', 'lname', 'username']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const loginSchema = {
  tags: ['Authentication'],
  summary: 'User login',
  description: 'Authenticate user and return login token',
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
        description: 'User password'
      }
    },
    required: ['email', 'password']
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
            is2FAEnabled: { 
              type: 'boolean',
              description: 'Whether 2FA is enabled for this user'
            },
            token: { 
              type: 'string',
              description: 'Authentication token'
            }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const verifyEmailSchema = {
  tags: ['Authentication'],
  summary: 'Verify email address',
  description: 'Verify user email address with verification code',
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      code: {
        type: 'string',
        description: 'Email verification code'
      }
    },
    required: ['email', 'code']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const forgotPasswordSchema = {
  tags: ['Authentication'],
  summary: 'Forgot password',
  description: 'Send password reset email to user',
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      }
    },
    required: ['email']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const resetPasswordSchema = {
  tags: ['Authentication'],
  summary: 'Reset password',
  description: 'Reset user password using reset code',
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      code: {
        type: 'string',
        description: 'Password reset code'
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        description: 'New password (minimum 6 characters)'
      },
      confirmPassword: {
        type: 'string',
        minLength: 6,
        description: 'Confirm new password'
      }
    },
    required: ['email', 'code', 'newPassword', 'confirmPassword']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const changePasswordSchema = {
  tags: ['Authentication'],
  summary: 'Change password',
  description: 'Change user password (requires authentication)',
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
    required: ['oldPassword', 'newPassword']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};